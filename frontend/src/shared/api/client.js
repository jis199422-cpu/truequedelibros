import axios from 'axios'
import useAuthStore from '../../features/auth/store/authStore'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let queue = []

const flushQueue = (error, token) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  queue = []
}

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isAuthEndpoint = original.url?.includes('/auth/login') || original.url?.includes('/auth/register')
    if (error.response?.status !== 401 || original._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }

    if (refreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return client(original)
      })
    }

    original._retry = true
    refreshing = true

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      useAuthStore.getState().setAuth(data.accessToken, data.user)
      flushQueue(null, data.accessToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      return client(original)
    } catch (err) {
      flushQueue(err, null)
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      refreshing = false
    }
  }
)

export default client
