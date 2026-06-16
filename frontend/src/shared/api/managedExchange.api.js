import client from './client'

export const registerManagedExchangeInterest = (conversationId) =>
  client.post('/managed-exchange/interest', { conversationId: conversationId ?? null })
