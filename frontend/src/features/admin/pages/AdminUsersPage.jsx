import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminUsers, toggleBanUser } from '../../../shared/api/admin.api'
import { Spinner } from '../../../shared/components/Spinner'

export function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    getAdminUsers()
      .then(({ data }) => setUsers(data))
      .catch(() => toast.error('Error al cargar usuarios'))
      .finally(() => setLoading(false))
  }, [])

  const handleToggleBan = async (user) => {
    setToggling(user.id)
    try {
      const { data } = await toggleBanUser(user.id)
      setUsers((prev) => prev.map((u) => u.id === data.id ? data : u))
      toast.success(data.active ? `${data.name} desbaneado` : `${data.name} baneado`)
    } catch {
      toast.error('Error al actualizar el usuario')
    } finally {
      setToggling(null)
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Usuarios ({users.length})</h1>
        <input
          className="admin-search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Libros</th>
              <th>Registro</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className={!user.active ? 'admin-row-banned' : ''}>
                <td className="admin-cell-name">{user.name}</td>
                <td className="admin-cell-email">{user.email}</td>
                <td>
                  <span className={`admin-role-chip ${user.role === 'ADMIN' ? 'admin-role-chip--admin' : ''}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.bookCount}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <span className={`admin-status-chip ${user.active ? 'admin-status-chip--active' : 'admin-status-chip--banned'}`}>
                    {user.active ? 'Activo' : 'Baneado'}
                  </span>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${user.active ? 'admin-ban-btn' : 'admin-unban-btn'}`}
                    disabled={toggling === user.id || user.role === 'ADMIN'}
                    onClick={() => handleToggleBan(user)}
                    title={user.role === 'ADMIN' ? 'No se puede banear a un administrador' : ''}
                  >
                    {toggling === user.id
                      ? <Spinner size="sm" />
                      : user.active ? 'Banear' : 'Desbanear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="admin-empty">No se encontraron usuarios</p>
        )}
      </div>
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}
