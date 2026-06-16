import client from './client'

export const requestHomeDelivery = (conversationId) =>
  client.post('/support/home-delivery', { conversationId })
