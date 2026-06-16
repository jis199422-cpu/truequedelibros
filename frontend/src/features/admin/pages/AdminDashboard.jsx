import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminStats } from '../../../shared/api/admin.api'
import { Spinner } from '../../../shared/components/Spinner'

export function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Error al cargar estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>

      <div className="admin-stats-grid">
        <StatCard label="Usuarios totales" value={stats.totalUsers} color="primary" />
        <StatCard label="Usuarios activos" value={stats.activeUsers} color="success" />
        <StatCard label="Usuarios baneados" value={stats.bannedUsers} color="error" />
        <StatCard label="Nuevos esta semana" value={stats.newUsersThisWeek} color="tertiary" />
        <StatCard label="Libros totales" value={stats.totalBooks} color="primary" />
        <StatCard label="Libros disponibles" value={stats.availableBooks} color="success" />
        <StatCard label="Trueques (matches)" value={stats.totalMatches} color="tertiary" />
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={`admin-stat-card admin-stat-card--${color}`}>
      <span className="admin-stat-value">{value.toLocaleString('es')}</span>
      <span className="admin-stat-label">{label}</span>
    </div>
  )
}
