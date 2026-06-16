import { useEffect, useState } from 'react'
import { getEstadisticas } from '../api/beneficios.api'

export function StatsPanel({ localId }) {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    setLoading(true)
    getEstadisticas(localId)
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { refresh() }, [localId])

  if (loading) return <div style={styles.panel}><p>Cargando estadísticas…</p></div>
  if (!stats)  return null

  const items = [
    { label: 'Validados hoy',  value: stats.validadosHoy,   color: '#16a34a' },
    { label: 'Validados este mes', value: stats.validadosMes, color: '#2563eb' },
    { label: 'Total validados', value: stats.totalValidados, color: '#7c3aed' },
    { label: 'Expirados',      value: stats.totalExpirados,  color: '#d97706' },
    { label: 'Pendientes',     value: stats.totalPendiente,  color: '#6b7280' },
  ]

  return (
    <div style={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={styles.title}>Estadísticas</h2>
        <button style={styles.refreshBtn} onClick={refresh}>↻ Actualizar</button>
      </div>
      <div style={styles.grid}>
        {items.map(({ label, value, color }) => (
          <div key={label} style={styles.stat}>
            <span style={{ ...styles.statValue, color }}>{value}</span>
            <span style={styles.statLabel}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  panel: {
    background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flex: 1, minWidth: 280,
  },
  title: { margin: 0, fontSize: 18, fontWeight: 700 },
  refreshBtn: {
    background: 'none', border: '1px solid #ddd', borderRadius: 6,
    padding: '4px 10px', fontSize: 13, cursor: 'pointer', color: '#555',
  },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  stat: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: 16, borderRadius: 8, background: '#f9f9f9',
  },
  statValue: { fontSize: 28, fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: 12, color: '#777', marginTop: 4, textAlign: 'center' },
}
