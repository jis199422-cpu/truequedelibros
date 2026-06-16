import client from './client'

export const getMatches = () => client.get('/matches')
export const getLikesReceived = (page = 0) => client.get('/likes/received', { params: { page } })
export const getDailyLikeStatus = () => client.get('/likes/daily-status')
