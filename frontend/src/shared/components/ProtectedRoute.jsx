import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../../features/auth/store/authStore'

export function ProtectedRoute() {
  const { accessToken, user } = useAuthStore()
  const initialized = useAuthStore((s) => s.initialized)
  if (!initialized) return null
  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role === 'LOCAL') return <Navigate to="/local/dashboard" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { accessToken, user } = useAuthStore()
  const initialized = useAuthStore((s) => s.initialized)
  if (!initialized) return null
  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/feed" replace />
  return <Outlet />
}

export function LocalRoute() {
  const { accessToken, user } = useAuthStore()
  const initialized = useAuthStore((s) => s.initialized)
  if (!initialized) return null
  if (!accessToken) return <Navigate to="/login" replace />
  if (user?.role !== 'LOCAL') return <Navigate to="/feed" replace />
  return <Outlet />
}
