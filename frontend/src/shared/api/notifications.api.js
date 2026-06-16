import client from './client'

export const getNotifications = () => client.get('/notifications')
export const getUnreadCount = () => client.get('/notifications/unread-count')
export const markAllRead = () => client.put('/notifications/read-all')
