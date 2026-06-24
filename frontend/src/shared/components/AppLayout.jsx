import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import useAuthStore from '../../features/auth/store/authStore'
import { useHasAvailableBooks } from '../../features/books/hooks/useHasAvailableBooks'

export function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <main className="app-main">
        {children ?? <Outlet />}
      </main>
      <BottomNav />
    </div>
  )
}

export function GuestFeedLayout({ children }) {
  const navigate = useNavigate()
  return (
    <div className="app-layout">
      <div className="guest-banner">
        <p className="guest-banner-text">¡Intercambiá libros con personas cerca tuyo!</p>
        <div className="guest-banner-actions">
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/register', { state: { source: 'guest_banner' } })}>
            Crear cuenta
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>
            Iniciar sesión
          </button>
        </div>
      </div>
      <main className="app-main app-main--guest">
        {children ?? <Outlet />}
      </main>
    </div>
  )
}

function BottomNav() {
  const { accessToken, user } = useAuthStore()
  const { hasAvailableBooks } = useHasAvailableBooks()
  if (!accessToken) return null

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <NavLink to="/feed" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <FeedIcon />
        <span>Libros Cercanos</span>
      </NavLink>
      <NavLink to="/likes" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <HeartIcon />
        <span>Trueques</span>
      </NavLink>
      <NavLink to="/chat" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <ChatIcon />
        <span>Mensajes</span>
      </NavLink>
      {user?.role !== 'LOCAL' && (
        <NavLink to="/puntos-seguros" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <GiftIcon />
          <span>Puntos Seguros</span>
        </NavLink>
      )}
      <NavLink to="/profile/me" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <ProfileIcon />
          {!hasAvailableBooks && (
            <span style={{
              position: 'absolute', top: '-2px', right: '-4px',
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: '#e53e3e', border: '1.5px solid #fff',
              display: 'block'
            }} />
          )}
        </div>
        <span>Perfil</span>
      </NavLink>
    </nav>
  )
}

function FeedIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
