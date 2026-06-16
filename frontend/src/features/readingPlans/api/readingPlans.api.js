import client from '../../../shared/api/client'

export const getReadingPlans = (page = 0) =>
  client.get(`/reading-plans?page=${page}`)

export const createReadingPlan = (data) =>
  client.post('/reading-plans', data)

export const updateReadingPlan = (id, data) =>
  client.put(`/reading-plans/${id}`, data)

export const deleteReadingPlan = (id) =>
  client.delete(`/reading-plans/${id}`)

export const joinReadingPlan = (id) =>
  client.post(`/reading-plans/${id}/join`)

export const leaveReadingPlan = (id) =>
  client.delete(`/reading-plans/${id}/join`)
