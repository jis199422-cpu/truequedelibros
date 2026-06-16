import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import useAuthStore from '../../auth/store/authStore'

const StompCtx = createContext(null)

export function StompProvider({ children }) {
  const clientRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)
  const msgCbsRef = useRef(new Set())
  const notifCbsRef = useRef(new Set())
  const typingCbsRef = useRef(new Set())
  const presenceCbsRef = useRef(new Set())

  useEffect(() => {
    if (!accessToken) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_WS_BASE_URL ?? ''}/ws`),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe('/user/topic/messages', (f) => {
          const msg = JSON.parse(f.body)
          msgCbsRef.current.forEach((cb) => cb(msg))
        })
        client.subscribe('/user/topic/notifications', (f) => {
          const notif = JSON.parse(f.body)
          notifCbsRef.current.forEach((cb) => cb(notif))
        })
        client.subscribe('/user/topic/typing', (f) => {
          const event = JSON.parse(f.body)
          typingCbsRef.current.forEach((cb) => cb(event))
        })
        client.subscribe('/user/topic/presence', (f) => {
          const event = JSON.parse(f.body)
          presenceCbsRef.current.forEach((cb) => cb(event))
        })
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    })

    client.activate()
    clientRef.current = client

    return () => {
      setConnected(false)
      client.deactivate()
      clientRef.current = null
    }
  }, [accessToken])

  const sendMessage = useCallback((conversationId, content) => {
    const c = clientRef.current
    if (!c?.connected) return false
    c.publish({ destination: `/app/chat/${conversationId}`, body: JSON.stringify({ content }) })
    return true
  }, [])

  const sendTyping = useCallback((conversationId, typing) => {
    const c = clientRef.current
    if (!c?.connected) return
    c.publish({ destination: `/app/chat/${conversationId}/typing`, body: JSON.stringify({ typing }) })
  }, [])

  // Returns an unsubscribe function — use as useEffect cleanup
  const subscribeMessages = useCallback((cb) => {
    msgCbsRef.current.add(cb)
    return () => msgCbsRef.current.delete(cb)
  }, [])

  const subscribeNotifications = useCallback((cb) => {
    notifCbsRef.current.add(cb)
    return () => notifCbsRef.current.delete(cb)
  }, [])

  const subscribeTyping = useCallback((cb) => {
    typingCbsRef.current.add(cb)
    return () => typingCbsRef.current.delete(cb)
  }, [])

  const subscribePresence = useCallback((cb) => {
    presenceCbsRef.current.add(cb)
    return () => presenceCbsRef.current.delete(cb)
  }, [])

  return (
    <StompCtx.Provider value={{ sendMessage, sendTyping, connected, subscribeMessages, subscribeNotifications, subscribeTyping, subscribePresence }}>
      {children}
    </StompCtx.Provider>
  )
}

export const useStomp = () => useContext(StompCtx)
