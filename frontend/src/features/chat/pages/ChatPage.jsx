import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../../auth/store/authStore'
import { getConversations, getMessages } from '../../../shared/api/conversations.api'
import { getUserOnlineStatus } from '../../../shared/api/users.api'
import { useStomp } from '../context/StompContext'
import { trackMessageSent } from '../../../shared/utils/metaPixel'
import { Spinner } from '../../../shared/components/Spinner'
import { ManagedExchangeBanner } from '../components/ManagedExchangeBanner'
import { UserAvatar } from '../../../shared/components/UserAvatar'

export function ChatPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useAuthStore((s) => s.user)
  const bookHint = location.state?.bookHint
  const inputPlaceholder = bookHint
    ? bookHint.isVenta
      ? `Escribile a ${bookHint.ownerName} para coordinar la compra...`
      : `Escribile a ${bookHint.ownerName} para coordinar la entrega...`
    : 'Escribe un mensaje...'

  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [otherOnline, setOtherOnline] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [otherTyping, setOtherTyping] = useState(false)
  const bottomRef = useRef(null)
  const prevConnectedRef = useRef(false)
  const typingTimeoutRef = useRef(null)

  const { sendMessage, sendTyping, connected, subscribeMessages, subscribeTyping, subscribePresence } = useStomp()

  // Subscribe to incoming messages from the global STOMP connection
  useEffect(() => {
    return subscribeMessages((msg) => {
      if (String(msg.conversationId) !== String(conversationId)) return
      setMessages((prev) => {
        const tempIdx = findLastTempIndex(prev, msg)
        const withoutTemp = tempIdx !== -1 ? prev.filter((_, i) => i !== tempIdx) : prev
        return withoutTemp.some((m) => m.id === msg.id) ? withoutTemp : [...withoutTemp, msg]
      })
    })
  }, [subscribeMessages, conversationId])

  useEffect(() => {
    return subscribeTyping((event) => {
      if (String(event.conversationId) !== String(conversationId)) return
      setOtherTyping(event.typing)
    })
  }, [subscribeTyping, conversationId])

  useEffect(() => {
    return subscribePresence((event) => {
      if (otherUser && event.userId === otherUser.id) setOtherOnline(event.online)
    })
  }, [subscribePresence, otherUser])

  useEffect(() => {
    if (!otherUser) return
    getUserOnlineStatus(otherUser.id)
      .then(({ data }) => setOtherOnline(data.online))
      .catch(() => {})
  }, [otherUser])

  useEffect(() => {
    let cancelled = false

    getConversations()
      .then(({ data }) => {
        if (cancelled) return
        const conv = data.find((c) => c.id === conversationId)
        if (conv) setOtherUser(conv.otherUser)
      })
      .catch(() => {})

    // getMessages also marks messages and their notifications as read (backend)
    getMessages(conversationId)
      .then(({ data }) => {
        if (!cancelled) {
          setMessages([...data].reverse())
          window.dispatchEvent(new Event('messages-read'))
        }
      })
      .catch(() => { if (!cancelled) toast.error('Error al cargar los mensajes') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Polling fallback: fast (3s) when disconnected, slow (15s) safety net when connected
  useEffect(() => {
    if (loading) return
    const interval = connected ? 15000 : 3000
    const poll = setInterval(async () => {
      try {
        const { data } = await getMessages(conversationId)
        setMessages((prev) => {
          const existingIds = new Set(
            prev.filter((m) => !String(m.id).startsWith('temp-')).map((m) => m.id)
          )
          const fresh = [...data].reverse().filter((m) => !existingIds.has(m.id))
          if (!fresh.length) return prev
          let base = prev
          for (const realMsg of fresh) {
            const idx = findLastTempIndex(base, realMsg)
            if (idx !== -1) base = base.filter((_, i) => i !== idx)
          }
          return [...base, ...fresh]
        })
      } catch {}
    }, interval)
    return () => clearInterval(poll)
  }, [connected, loading, conversationId])

  // Refetch on reconnect to recover messages missed during the disconnection gap
  useEffect(() => {
    if (loading) return
    if (connected && !prevConnectedRef.current) {
      getMessages(conversationId)
        .then(({ data }) => {
          setMessages((prev) => {
            const existingIds = new Set(
              prev.filter((m) => !String(m.id).startsWith('temp-')).map((m) => m.id)
            )
            const fresh = [...data].reverse().filter((m) => !existingIds.has(m.id))
            if (!fresh.length) return prev
            let base = prev
            for (const realMsg of fresh) {
              const idx = findLastTempIndex(base, realMsg)
              if (idx !== -1) base = base.filter((_, i) => i !== idx)
            }
            return [...base, ...fresh]
          })
        })
        .catch(() => {})
    }
    prevConnectedRef.current = connected
  }, [connected, loading, conversationId])

  const handleTypingInput = (e) => {
    setInput(e.target.value)
    if (!connected) return
    sendTyping(conversationId, true)
    clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => sendTyping(conversationId, false), 2000)
  }

  const handleSend = () => {
    const content = input.trim()
    if (!content || !connected) return

    clearTimeout(typingTimeoutRef.current)
    sendTyping(conversationId, false)

    const isFirstMessage = messages.length === 0
    const optimistic = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: currentUser?.id,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => [...prev, optimistic])
    setInput('')
    sendMessage(conversationId, content)
    trackMessageSent({ conversationId, recipientUserId: otherUser?.id, isFirstMessage })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="chat-thread">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/chat')} aria-label="Volver">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        {otherUser && (
          <div className="chat-header-content">
            <div className="chat-header-top">
              <button
                className="chat-avatar-btn"
                onClick={() => navigate(`/profile/${otherUser.id}`)}
                aria-label={`Ver perfil de ${otherUser.name}`}
              >
                <OtherAvatar user={otherUser} />
              </button>
              <div className="chat-header-info">
                <span className="chat-header-name">{otherUser.name}</span>
                {otherTyping
                  ? <span className="chat-header-typing">Escribiendo...</span>
                  : <span className={`chat-status-pill ${otherOnline ? 'chat-status-pill--on' : 'chat-status-pill--off'}`}>
                      {otherOnline ? 'Conectado' : 'Desconectado'}
                    </span>
                }
                <button
                  className="chat-view-books-link"
                  onClick={() => navigate(`/profile/${otherUser.id}`)}
                >
                  Ver los libros de {otherUser.name}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="messages-list messages-list--with-banner">
        {messages.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: '2rem' }}>
            ¡Empieza la conversación!
          </p>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUser?.id} />
        ))}
        {otherTyping && otherUser && <TypingBubble />}
        <div ref={bottomRef} />
      </div>

      <ManagedExchangeBanner conversationId={conversationId} />
      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          value={input}
          onChange={handleTypingInput}
          onKeyDown={handleKeyDown}
          placeholder={inputPlaceholder}
          rows={1}
        />
        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || !connected}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function findLastTempIndex(messages, incoming) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (
      typeof m.id === 'string' &&
      m.id.startsWith('temp-') &&
      String(m.senderId) === String(incoming.senderId) &&
      m.content === incoming.content
    ) {
      return i
    }
  }
  return -1
}

function MessageBubble({ message, isOwn }) {
  if (message.system) {
    return <div className="message-system">{message.content}</div>
  }
  return (
    <div className={`message-bubble ${isOwn ? 'message-own' : 'message-other'}`}>
      <span className="message-sender">{isOwn ? 'Yo' : message.senderName}</span>
      {message.content}
      <div className="message-time">
        {new Date(message.createdAt).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="typing-bubble message-other">
      <span className="typing-dots">
        <span /><span /><span />
      </span>
    </div>
  )
}

function OtherAvatar({ user }) {
  return <UserAvatar name={user.name} url={user.profilePictureUrl} seed={user.id} size={36} />
}
