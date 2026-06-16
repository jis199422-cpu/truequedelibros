import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAuthStore from '../../auth/store/authStore'
import { getLocales } from '../api/beneficios.api'
import { ValidarCuponPanel } from '../components/ValidarCuponPanel'
import { StatsPanel } from '../components/StatsPanel'

export function LocalDashboardPage() {
  const user = useAuthStore(s => s.user)
  const [localId, setLocalId] = useState(null)
  const [localName, setLocalName] = useState('')
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams()
  const initialCode = searchParams.get('code')?.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 5) ?? ''

  useEffect(() => {
    getLocales()
      .then(({ data }) => {
        const mine = data.find(l => l.ownerId === user?.id)
        if (mine) {
          setLocalId(mine.id)
          setLocalName(mine.name)
        }
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#888' }}>Cargando…</p>
      </div>
    )
  }

  if (!localId) {
    return (
      <div style={styles.page}>
        <p style={{ color: '#888' }}>
          No se encontró un local asociado a tu cuenta. Contactá al administrador.
        </p>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>{localName}</h1>
      <p style={styles.subheading}>Panel del Punto Seguro de Trueque</p>
      <div style={styles.panels}>
        <ValidarCuponPanel localId={localId} initialCode={initialCode} />
        <StatsPanel localId={localId} />
      </div>
    </div>
  )
}

const styles = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  heading: { margin: '0 0 4px', fontSize: 22, fontWeight: 800 },
  subheading: { margin: '0 0 24px', fontSize: 14, color: '#666' },
  panels: { display: 'flex', gap: 20, flexWrap: 'wrap' },
}
