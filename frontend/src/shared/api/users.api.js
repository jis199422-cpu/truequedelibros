import client from './client'

export const updateProfile = (data) => client.put('/users/me', data)
export const updateLocation = (data) => client.put('/users/me/location', data)
export const getAvatarUploadUrl = (data) => client.post('/users/me/avatar-url', data)
export const getPublicProfile = (userId) => client.get(`/users/${userId}`)
export const getUserOnlineStatus = (userId) => client.get(`/users/${userId}/online`)

export const saveSubscriptionInterest = (interested) =>
  client.post('/users/me/subscription-interest', { interested })

export const uploadToS3 = (uploadUrl, file) =>
  fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })

export const getUserInterests = () => client.get('/users/me/interests')
export const saveUserInterests = (interests) => client.post('/users/me/interests', { interests })
