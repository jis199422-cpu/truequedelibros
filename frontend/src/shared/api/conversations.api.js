import client from './client'

export const getConversations = () => client.get('/conversations')
export const getMessages = (conversationId, page = 0) =>
  client.get(`/conversations/${conversationId}/messages?page=${page}`)
export const startOfferConversation = (targetUserId) =>
  client.post('/conversations/offer', { targetUserId })

export const startBookConversation = (bookId) =>
  client.post('/conversations/book-contact', { bookId })
