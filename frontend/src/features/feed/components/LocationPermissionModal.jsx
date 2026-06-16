import { useState, useEffect } from 'react'

export function LocationPermissionModal({ onSuccess, onDismiss }) {
  const [requesting, setRequesting] = useState(false)
  const [error, setError] = useState(null)
  const [blocked, setBlocked] = useState(false)

  useEffect(() => {
    if (!navigator.permissions) return
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') setBlocked(true)
      result.onchange = () => {
        setBlocked(result.state === 'denied')
        if (result.state === 'granted') setError(null)
      }
    }).catch(() => {})
  }, [])

  const handleActivate = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.')
      return
    }
    setRequesting(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setRequesting(false)
        onSuccess({ latitude: coords.latitude, longitude: coords.longitude })
      },
      (err) => {
        setRequesting(false)
        if (err.code === 1) {
          setBlocked(true)
        } else {
          setError('No pudimos obtener tu ubicación. Intentá de nuevo.')
        }
      }
    )
  }

  if (blocked) {
    return (
      <div className="modal-overlay" onClick={onDismiss}>
        <div className="auth-prompt-modal" style={{ gap: '0.75rem', maxWidth: '22rem' }} onClick={(e) => e.stopPropagation()}>
          <span style={{ fontSize: '2rem' }}>🔒</span>
          <h2 className="auth-prompt-title" style={{ fontSize: '1.2rem' }}>Ubicación bloqueada</h2>
          <p className="auth-prompt-sub">
            El navegador tiene el permiso de ubicación bloqueado para este sitio. Para activarlo:
          </p>

          <BlockedIllustration />

          <ol style={{ textAlign: 'left', fontSize: '0.82rem', color: 'var(--color-text, #1a202c)', margin: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            <li>Hacé clic en el ícono 🔒 o <strong>ⓘ</strong> en la barra de dirección.</li>
            <li>Buscá <strong>Ubicación</strong> y cambialo a <strong>"Permitir"</strong>.</li>
            <li>Recargá la página y volvé a intentarlo.</li>
          </ol>

          <button className="btn btn-outline" onClick={onDismiss} style={{ marginTop: '0.25rem' }}>
            Entendido
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="auth-prompt-modal" style={{ gap: '0.75rem', maxWidth: '22rem' }} onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '2rem' }}>📍</span>
        <h2 className="auth-prompt-title" style={{ fontSize: '1.2rem' }}>Activá tu ubicación</h2>
        <p className="auth-prompt-sub">
          Para mostrarte los libros más cercanos necesitamos saber dónde estás.
        </p>

        <BrowserPromptIllustration />

        <p className="auth-prompt-sub" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          Cuando el navegador te pregunte, hacé clic en <strong>"Permitir"</strong> como se muestra arriba.
        </p>

        {error && (
          <p style={{ color: 'var(--color-error, #e53e3e)', fontSize: '0.82rem', margin: 0 }}>
            {error}
          </p>
        )}

        <button className="btn btn-primary" onClick={handleActivate} disabled={requesting}>
          {requesting ? 'Esperando permiso…' : 'Activar ubicación'}
        </button>
        <button className="btn btn-outline" onClick={onDismiss} style={{ marginTop: '0.25rem' }}>
          Ahora no
        </button>
      </div>
    </div>
  )
}

function BlockedIllustration() {
  return (
    <svg
      viewBox="0 0 280 80"
      width="100%"
      style={{ borderRadius: '10px', border: '1px solid var(--color-border, #e2e8f0)', display: 'block' }}
      aria-hidden="true"
    >
      <rect width="280" height="80" fill="#f8f9fa" rx="10" />
      <rect width="280" height="28" fill="#e9ecef" rx="10" />
      <rect y="18" width="280" height="10" fill="#e9ecef" />
      <circle cx="16" cy="14" r="5" fill="#ff5f57" />
      <circle cx="30" cy="14" r="5" fill="#febc2e" />
      <circle cx="44" cy="14" r="5" fill="#28c840" />
      {/* URL bar */}
      <rect x="58" y="6" width="170" height="16" fill="#fff" rx="8" />
      {/* Lock icon highlighted */}
      <rect x="62" y="9" width="12" height="10" fill="#fef3c7" rx="2" stroke="#f59e0b" strokeWidth="1" />
      <text x="68" y="18" textAnchor="middle" fontSize="8" fill="#b45309">🔒</text>
      <text x="150" y="18" textAnchor="middle" fontSize="7" fill="#6c757d">truequedelibros.com</text>
      {/* Arrow pointing to lock */}
      <polygon points="68,30 62,40 74,40" fill="#f59e0b" />
      {/* Callout */}
      <rect x="30" y="42" width="220" height="28" fill="#fffbeb" rx="6" stroke="#f59e0b" strokeWidth="1" />
      <text x="140" y="53" textAnchor="middle" fontSize="7" fill="#92400e" fontWeight="bold">Hacé clic aquí → ubicación → Permitir</text>
      <text x="140" y="63" textAnchor="middle" fontSize="7" fill="#92400e">Luego recargá la página</text>
    </svg>
  )
}

function BrowserPromptIllustration() {
  return (
    <svg
      viewBox="0 0 280 120"
      width="100%"
      style={{ borderRadius: '10px', border: '1px solid var(--color-border, #e2e8f0)', display: 'block' }}
      aria-hidden="true"
    >
      {/* Background */}
      <rect width="280" height="120" fill="#f8f9fa" rx="10" />

      {/* Top bar */}
      <rect width="280" height="32" fill="#e9ecef" rx="10" />
      <rect y="22" width="280" height="10" fill="#e9ecef" />

      {/* Window dots */}
      <circle cx="16" cy="16" r="5" fill="#ff5f57" />
      <circle cx="30" cy="16" r="5" fill="#febc2e" />
      <circle cx="44" cy="16" r="5" fill="#28c840" />

      {/* URL bar */}
      <rect x="60" y="8" width="160" height="16" fill="#fff" rx="8" />
      <text x="140" y="20" textAnchor="middle" fontSize="8" fill="#6c757d">truequedelibros.com</text>

      {/* Popup box */}
      <rect x="30" y="38" width="220" height="74" fill="#fff" rx="8"
        stroke="#dee2e6" strokeWidth="1" />

      {/* Pin icon area */}
      <circle cx="50" cy="60" r="10" fill="#ebf4ff" />
      <text x="50" y="64" textAnchor="middle" fontSize="12">📍</text>

      {/* Popup text */}
      <text x="68" y="54" fontSize="8" fill="#212529" fontWeight="bold">truequedelibros.com</text>
      <text x="68" y="65" fontSize="7" fill="#495057">quiere acceder a tu</text>
      <text x="68" y="74" fontSize="7" fill="#495057">ubicación</text>

      {/* Bloquear button */}
      <rect x="36" y="88" width="64" height="16" fill="#fff" rx="6"
        stroke="#dee2e6" strokeWidth="1" />
      <text x="68" y="99" textAnchor="middle" fontSize="7" fill="#6c757d">Bloquear</text>

      {/* Permitir button — highlighted */}
      <rect x="110" y="86" width="124" height="20" fill="#4f46e5" rx="6" />
      <text x="172" y="100" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">
        ✓ Permitir
      </text>

      {/* Arrow pointing to Permitir */}
      <polygon points="172,80 166,70 178,70" fill="#4f46e5" />
    </svg>
  )
}
