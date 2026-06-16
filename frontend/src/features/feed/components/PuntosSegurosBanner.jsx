import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function PuntosSegurosBanner() {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(
    () => { try { return localStorage.getItem('puntosSegurosBannerDismissed') === 'true' } catch { return false } }
  )

  if (dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem('puntosSegurosBannerDismissed', 'true')
    setDismissed(true)
  }

  return (
    <div style={styles.banner}>
      <span style={styles.icon}>📍</span>
      <div style={styles.content}>
        <p style={styles.text}>
          Coordiná tu encuentro en un local seguro cerca tuyo.
        </p>
        <button style={styles.link} onClick={() => navigate('/puntos-seguros')}>
          Ver puntos
        </button>
      </div>
      <button style={styles.dismiss} onClick={handleDismiss} aria-label="Cerrar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

const styles = {
  banner: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: '#f5e6cc', borderRadius: 10, padding: '12px 14px',
    margin: '8px 16px 0',
  },
  icon: { fontSize: 18, flexShrink: 0, lineHeight: 1.3 },
  content: { flex: 1 },
  text: { margin: '0 0 4px', fontSize: 13, color: '#4B0082', lineHeight: 1.4 },
  link: {
    background: 'none', border: 'none', padding: 0,
    color: '#4B0082', fontSize: 13, fontWeight: 700, cursor: 'pointer',
    textDecoration: 'underline',
  },
  dismiss: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#4B0082', opacity: 0.6, padding: 2, flexShrink: 0,
  },
}
