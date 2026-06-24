import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getLocales } from '../api/beneficios.api'
import { LocalCard } from '../components/LocalCard'
import { BeneficioModal } from '../components/BeneficioModal'
import { LibrosDelLocalModal } from '../components/LibrosDelLocalModal'
import useAuthStore from '../../auth/store/authStore'
import useTermsGateStore from '../../terms/store/termsGateStore'

export function BeneficiosPage() {
  const termsAccepted = useAuthStore((s) => !!s.user?.termsAcceptedAt)
  const [locales, setLocales]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedLocal, setSelectedLocal] = useState(null)
  const [librosLocal, setLibrosLocal] = useState(null)

  useEffect(() => {
    if (!termsAccepted) return
    getLocales()
      .then(({ data }) => setLocales(data))
      .catch(() => toast.error('Error al cargar beneficios'))
      .finally(() => setLoading(false))
  }, [termsAccepted])

  if (!termsAccepted) {
    return (
      <div style={styles.page}>
        <h1 style={styles.heading}>Puntos Seguros de Trueque</h1>
        <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
          Para ver los Puntos Seguros, primero tenés que aceptar los términos y condiciones.
        </p>
        <button
          style={styles.termsLink}
          onClick={() => useTermsGateStore.getState().requireTerms(() => {})}
        >
          Ver términos y condiciones
        </button>
      </div>
    )
  }

  if (loading) {
    return <div style={styles.page}><p style={{ color: '#888' }}>Cargando puntos seguros…</p></div>
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>Puntos Seguros de Trueque</h1>
      <p style={styles.subheading}>Locales donde podés canjear beneficios y coordinar tus trueques de libros</p>

      {locales.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>
          Próximamente habrá Puntos Seguros de Trueque disponibles.
        </p>
      ) : (
        locales.map(local => (
          <LocalCard
            key={local.id}
            local={local}
            onCanjear={setSelectedLocal}
            onVerLibros={setLibrosLocal}
          />
        ))
      )}

      {selectedLocal && (
        <BeneficioModal
          local={selectedLocal}
          onClose={() => setSelectedLocal(null)}
        />
      )}

      {librosLocal && (
        <LibrosDelLocalModal
          local={librosLocal}
          onClose={() => setLibrosLocal(null)}
        />
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 640, margin: '0 auto', padding: '24px 16px 96px' },
  heading: { margin: '0 0 4px', fontSize: 22, fontWeight: 800 },
  subheading: { margin: '0 0 24px', fontSize: 14, color: '#666' },
  termsLink: {
    display: 'block', margin: '16px auto 0', padding: '12px 20px',
    borderRadius: 10, border: 'none', background: '#5b8fa8', color: '#fff',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}
