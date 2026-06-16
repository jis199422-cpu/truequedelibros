import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { trackPageView } from './shared/utils/metaPixel'
import useAuthStore from './features/auth/store/authStore'
import { refresh } from './shared/api/auth.api'
import { StompProvider } from './features/chat/context/StompContext'
import { ProtectedRoute, AdminRoute, LocalRoute } from './shared/components/ProtectedRoute'
import { AppLayout, GuestFeedLayout } from './shared/components/AppLayout'
import { LoginPage } from './features/auth/pages/LoginPage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { VerifyEmailPage } from './features/auth/pages/VerifyEmailPage'
import { GoogleCallbackPage } from './features/auth/pages/GoogleCallbackPage'
import { ForgotPasswordPage } from './features/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from './features/auth/pages/ResetPasswordPage'
import { FeedPage } from './features/feed/pages/FeedPage'
import { ProfilePage } from './features/profile/pages/ProfilePage'
import { EditProfilePage } from './features/profile/pages/EditProfilePage'
import { MyBooksPage } from './features/books/pages/MyBooksPage'
import { BookFormPage } from './features/books/pages/BookFormPage'
import { LikesPage } from './features/likes/pages/LikesPage'
import { ConversationListPage } from './features/chat/pages/ConversationListPage'
import { ChatPage } from './features/chat/pages/ChatPage'
import { AdminLayout } from './features/admin/components/AdminLayout'
import { AdminDashboard } from './features/admin/pages/AdminDashboard'
import { AdminUsersPage } from './features/admin/pages/AdminUsersPage'
import { AdminBooksPage } from './features/admin/pages/AdminBooksPage'
import { ManagedExchangePage } from './features/managedExchange/pages/ManagedExchangePage'
import { BeneficiosPage } from './features/beneficios/pages/BeneficiosPage'
import { LocalDashboardPage } from './features/beneficios/pages/LocalDashboardPage'
import { AdminLocalesPage } from './features/admin/pages/AdminLocalesPage'

function AuthInitializer({ children }) {
  const { setAuth, clearAuth, setInitialized } = useAuthStore()
  const initialized = useAuthStore((s) => s.initialized)
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/auth/google/callback') {
      setInitialized()
      return
    }
    let cancelled = false
    refresh()
      .then(({ data }) => { if (!cancelled) setAuth(data.accessToken, data.user) })
      .catch(() => { if (!cancelled) clearAuth() })
      .finally(() => { if (!cancelled) setInitialized() })
    return () => { cancelled = true }
  }, [])

  if (!initialized) {
    return (
      <div className="spinner-page">
        <span className="spinner spinner-lg" />
      </div>
    )
  }

  return children
}

function RouteTracker() {
  const location = useLocation()
  const accessToken = useAuthStore((s) => s.accessToken)
  useEffect(() => {
    if (!accessToken) trackPageView()
  }, [location.pathname, accessToken])
  return null
}

function FeedRoute() {
  const { accessToken, user } = useAuthStore()
  if (accessToken && user?.role === 'LOCAL') return <Navigate to="/local/dashboard" replace />
  if (accessToken) {
    return (
      <AppLayout>
        <FeedPage />
      </AppLayout>
    )
  }
  return (
    <GuestFeedLayout>
      <FeedPage />
    </GuestFeedLayout>
  )
}

function CatchAll() {
  const { accessToken, user } = useAuthStore()
  if (accessToken && user?.role === 'LOCAL') return <Navigate to="/local/dashboard" replace />
  return <Navigate to="/feed" replace />
}

export default function App() {
  return (
    <AuthInitializer>
      <RouteTracker />
      <StompProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
          <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

          {/* Feed: public for guests, with AppLayout for authenticated */}
          <Route path="/feed" element={<FeedRoute />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/likes" element={<LikesPage />} />
              <Route path="/chat" element={<ConversationListPage />} />
              <Route path="/chat/:conversationId" element={<ChatPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/my-books" element={<MyBooksPage />} />
              <Route path="/books/new" element={<BookFormPage />} />
              <Route path="/books/:bookId/edit" element={<BookFormPage />} />
              <Route path="/gestion-trueque" element={<ManagedExchangePage />} />
              <Route path="/puntos-seguros" element={<BeneficiosPage />} />
              <Route path="/beneficios" element={<Navigate to="/puntos-seguros" replace />} />
            </Route>
          </Route>

          {/* LOCAL dashboard */}
          <Route element={<LocalRoute />}>
            <Route path="/local/dashboard" element={<LocalDashboardPage />} />
          </Route>

          {/* Redirects for old routes */}
          <Route path="/matches" element={<Navigate to="/likes" replace />} />
          <Route path="/wishlist" element={<Navigate to="/profile/me" replace />} />

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/books" element={<AdminBooksPage />} />
              <Route path="/admin/locales" element={<AdminLocalesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<CatchAll />} />
        </Routes>
      </StompProvider>
    </AuthInitializer>
  )
}
