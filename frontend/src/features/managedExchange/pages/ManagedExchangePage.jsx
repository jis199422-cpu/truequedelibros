import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { registerManagedExchangeInterest } from '../../../shared/api/managedExchange.api'

export function ManagedExchangePage() {
  const [searchParams] = useSearchParams()
  const conversationId = searchParams.get('from') || null

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInterest = async () => {
    setLoading(true)
    setError(null)
    try {
      await registerManagedExchangeInterest(conversationId)
      setSubmitted(true)
    } catch {
      setError('Hubo un error. Intentá nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mgex-page">
      <div className="mgex-page-card">
        <div className="mgex-page-icon">🚧</div>
        <h1 className="mgex-page-title">Esta funcionalidad está en construcción</h1>
        <p className="mgex-page-subtitle">
          Haz click en el botón de abajo si estás interesado en pagar una pequeña comisión
          por el envío del libro.
        </p>

        {submitted ? (
          <p className="mgex-page-confirmation">¡Te avisaremos cuando esté listo!</p>
        ) : (
          <>
            <button
              className="btn btn-primary mgex-page-btn"
              onClick={handleInterest}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Estoy dispuesto'}
            </button>
            {error && <p className="mgex-page-error">{error}</p>}
          </>
        )}
      </div>
    </div>
  )
}
