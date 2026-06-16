import { useEffect, useRef, useState, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import useAuthStore from '../../auth/store/authStore'

export function useStompChat({ onMessage, onNotification } = {}) {
  const clientRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const accessToken = useAuthStore((s) => s.accessToken)

  // Refs so the subscription closure always calls the latest callbacks
  const onMessageRef = useRef(onMessage)
  const onNotificationRef = useRef(onNotification)
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
  useEffect(() => { onNotificationRef.current = onNotification }, [onNotification])

  useEffect(() => {
    if (!accessToken) return

    const client = new Client({
      webSocketFactory: () => new SockJS(`${import.meta.env.VITE_WS_BASE_URL ?? ''}/ws`),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true)
        client.subscribe('/user/topic/messages', (frame) => {
          onMessageRef.current?.(JSON.parse(frame.body))
        })
        client.subscribe('/user/topic/notifications', (frame) => {
          onNotificationRef.current?.(JSON.parse(frame.body))
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
    const client = clientRef.current
    if (!client?.connected) return false
    client.publish({
      destination: `/app/chat/${conversationId}`,
      body: JSON.stringify({ content }),
    })
    return true
  }, [])

  return { sendMessage, connected }
}
