import { NavLink, Outlet, useNavigate } from 'react-router-dom'

export function AdminLayout() {
  const navigate = useNavigate()

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand" onClick={() => navigate('/admin')} role="button" tabIndex={0}
             onKeyDown={(e) => e.key === 'Enter' && navigate('/admin')}>
          <span className="admin-brand-icon">🔧</span>
          <span className="admin-brand-text">Admin</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <DashboardIcon /> Dashboard
          </NavLink>
          <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <UsersIcon /> Usuarios
          </NavLink>
          <NavLink to="/admin/books" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <BooksIcon /> Libros
          </NavLink>
          <NavLink to="/admin/locales" className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}>
            <LocalesIcon /> Locales
          </NavLink>
        </nav>

        <button className="admin-back-btn" onClick={() => navigate('/feed')}>
          ← Volver a la app
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function LocalesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function BooksIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}
