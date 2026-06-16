import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getConversations } from '../../../shared/api/conversations.api'
import { useStomp } from '../context/StompContext'
import { Spinner } from '../../../shared/components/Spinner'
import { UserAvatar } from '../../../shared/components/UserAvatar'

export function ConversationListPage() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const { subscribeNotifications } = useStomp()

  useEffect(() => {
    let cancelled = false
    getConversations()
      .then(({ data }) => { if (!cancelled) setConversations(data) })
      .catch(() => { if (!cancelled) toast.error('Error al cargar los mensajes') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    return subscribeNotifications((notif) => {
      if (notif.type !== 'NEW_MESSAGE') return
      getConversations()
        .then(({ data }) => setConversations(data))
        .catch(() => {})
    })
  }, [subscribeNotifications])

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="chat-page">
      <h1 className="page-title">Mensajes</h1>

      {conversations.length === 0 ? (
        <div className="placeholder-page">
          <h2>No tienes conversaciones</h2>
          <p>Cuando hagas match, podrás chatear aquí</p>
        </div>
      ) : (
        conversations.map((conv) => (
          <Link key={conv.id} to={`/chat/${conv.id}`} className="conversation-item">
            <Avatar name={conv.otherUser.name} url={conv.otherUser.profilePictureUrl} seed={conv.otherUser.id} />
            <div className="conv-info">
              <p className="conv-name">{conv.otherUser.name}</p>
              <p className="conv-last">
                {conv.lastMessage ? conv.lastMessage.content : 'Inicia la conversación'}
              </p>
            </div>
            <div className="conv-meta">
              {conv.updatedAt && <span className="conv-time">{formatTime(conv.updatedAt)}</span>}
              {conv.unreadCount > 0 && (
                <span className="unread-badge">{conv.unreadCount}</span>
              )}
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

function Avatar({ name, url, seed }) {
  return <UserAvatar name={name} url={url} seed={seed} size={40} className="avatar-sm" />
}

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
