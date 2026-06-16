function formatResetTime(resetAt) {
  if (!resetAt) return null
  try {
    return new Date(resetAt).toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return null
  }
}

export function LikeGateModal({ mode, resetAt, onDismiss, onAddBook, onPremium, onWait }) {
  const isBlocking = mode === 'blocking'
  const isExhausted = mode === 'exhausted'
  const isWarning = mode === 'warning'
  const dismissible = isWarning
  const resetTime = formatResetTime(resetAt)

  return (
    <div className="modal-overlay" onClick={dismissible ? onDismiss : undefined}>
      <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>

        {isExhausted ? (
          <>
            <span style={{ fontSize: '2.5rem' }}>⏰</span>
            <h2 className="auth-prompt-title">Ya usaste todos tus likes de hoy</h2>
            <p className="auth-prompt-sub">
              {resetTime
                ? `Tus likes se reinician a las ${resetTime} (hora Argentina).`
                : 'Tus likes se reinician en 12 horas.'}
              {' '}Pasate al plan Premium para tener likes ilimitados.
            </p>
            <button className="btn btn-primary" onClick={onPremium} style={{ marginTop: '0.25rem' }}>
              Ver plan Premium
            </button>
          </>
        ) : isBlocking ? (
          <>
            <span style={{ fontSize: '2.5rem' }}>🔒</span>
            <h2 className="auth-prompt-title">Necesitás agregar un libro</h2>
            <p className="auth-prompt-sub">
              Ya diste muchos likes sin tener libros para intercambiar.
              Para seguir usando la plataforma, agregá al menos un libro.
            </p>
            <p className="auth-prompt-sub" style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
              No te va a tomar más de 1 minuto.
            </p>
            <button className="btn btn-primary" onClick={onAddBook} style={{ marginTop: '0.25rem' }}>
              Añadir un libro
            </button>
            <button className="btn btn-outline" onClick={onPremium} style={{ marginTop: '0.5rem' }}>
              Pasate al plan Premium
            </button>
            <button className="btn btn-ghost" onClick={onWait} style={{ marginTop: '0.5rem', color: 'var(--color-text-muted)' }}>
              {resetTime ? `Volver a las ${resetTime}` : 'Esperar 12 horas'}
            </button>
            {resetTime && (
              <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                Tus likes se reinician a las {resetTime} (hora Argentina)
              </p>
            )}
          </>
        ) : (
          <>
            <span style={{ fontSize: '2.5rem' }}>📚</span>
            <h2 className="auth-prompt-title">¡Agregá un libro!</h2>
            <p className="auth-prompt-sub">
              Estás dando muchos likes, pero no tenés libros para intercambiar.
              La plataforma se nutre de los trueques entre los usuarios. Añadí un libro por favor.
            </p>
            <button className="btn btn-primary" onClick={onAddBook} style={{ marginTop: '0.25rem' }}>
              Añadir un libro
            </button>
            <button className="btn btn-outline" onClick={onPremium} style={{ marginTop: '0.5rem' }}>
              Pasate al plan Premium
            </button>
            <button className="btn btn-outline" onClick={onDismiss} style={{ marginTop: '0.5rem' }}>
              Ahora no
            </button>
          </>
        )}

      </div>
    </div>
  )
}
