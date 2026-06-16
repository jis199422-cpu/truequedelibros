import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getLocales } from '../api/beneficios.api'
import { LocalCard } from '../components/LocalCard'
import { BeneficioModal } from '../components/BeneficioModal'

export function BeneficiosPage() {
  const [locales, setLocales]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedLocal, setSelectedLocal] = useState(null)

  useEffect(() => {
    getLocales()
      .then(({ data }) => setLocales(data))
      .catch(() => toast.error('Error al cargar beneficios'))
      .finally(() => setLoading(false))
  }, [])

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
          />
        ))
      )}

      {selectedLocal && (
        <BeneficioModal
          local={selectedLocal}
          onClose={() => setSelectedLocal(null)}
        />
      )}
    </div>
  )
}

const styles = {
  page: { maxWidth: 640, margin: '0 auto', padding: '24px 16px 96px' },
  heading: { margin: '0 0 4px', fontSize: 22, fontWeight: 800 },
  subheading: { margin: '0 0 24px', fontSize: 14, color: '#666' },
}
