import axios from 'axios'
import client from './client'

export const register = (data) => client.post('/auth/register', data)
export const login = (data) => client.post('/auth/login', data)
export const verifyEmail = (token) => client.get(`/auth/verify-email?token=${token}`)
export const logout = () => client.post('/auth/logout')
export const forgotPassword = (data) => client.post('/auth/forgot-password', data)
export const resetPassword = (data) => client.post('/auth/reset-password', data)
export const getCurrentUser = () => client.get('/users/me')

// Deduplicated so StrictMode double-invoke doesn't rotate the refresh token twice
let refreshPromise = null
export const refresh = () => {
  if (!refreshPromise) {
    refreshPromise = axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .finally(() => { refreshPromise = null })
  }
  return refreshPromise
}
