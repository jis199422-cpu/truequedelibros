import { useNavigate } from 'react-router-dom'

export function PuntosSegurosChatBanner({ dismissed, onDismiss }) {
  const navigate = useNavigate()

  if (dismissed) return null

  return (
    <div className="mgex-banner">
      <span className="mgex-banner-text">
        ¿Acordaron el trueque? Coordiná el encuentro en un{' '}
        <button
          className="mgex-banner-link"
          onClick={() => navigate('/puntos-seguros')}
        >
          Punto Seguro de Trueque
        </button>{' '}
        cerca tuyo.
      </span>
      <button
        className="mgex-banner-dismiss"
        onClick={onDismiss}
        aria-label="Cerrar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
