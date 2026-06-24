export function PuntoSeguroLikeModal({ info, onClose }) {
  if (!info) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <div className="match-emoji">❤️</div>
        <h2>¡Genial! Ya podés disfrutar de esta nueva lectura</h2>
        <p>
          Andá al Punto Seguro <strong>{info.localName}</strong>
          {info.localAddress ? <> ({info.localAddress})</> : null}.{' '}
          Podés leerlo en el local o dejar uno de tus libros y retirarlo{' '}
          (debés devolverlo luego de los 30 días, o podés tenerlo por 60 días con la cuenta premium —{' '}
          escribí a <a href="mailto:contacto@truequedelibros.com" style={styles.link}>contacto@truequedelibros.com</a> para habilitarla).
        </p>
        <p style={{ fontSize: 13, opacity: 0.75 }}>
          Una vez que termines de leerlo, podés llevarte otro libro distinto del local o retirar el que dejaste al principio.
        </p>

        <div style={styles.plazoBox}>
          {info.isPremiumUser ? (
            <>📅 Como sos premium, tenés <strong>{info.plazoDias} días</strong> para devolverlo.</>
          ) : (
            <>
              📅 Tenés <strong>{info.plazoDias} días</strong> para devolverlo.{' '}
              ¿Querés más tiempo? Con el plan Premium tenés hasta 60 días — escribinos a{' '}
              <a href="mailto:contacto@truequedelibros.com" style={styles.link}>contacto@truequedelibros.com</a> para suscribirte.
            </>
          )}
        </div>

        <div style={styles.reminderBox}>
          ✉️ Importante: <strong>está estrictamente prohibida la venta de estos libros</strong> y <strong>deben ser devueltos al Punto Seguro</strong>. Cuando retires un libro, recordá
          avisarnos por mail a{' '}
          <a href="mailto:contacto@truequedelibros.com" style={styles.link}>contacto@truequedelibros.com</a> indicando cuál retiraste y qué libro dejaste.
          También avisanos cuando lo devuelvas.
        </div>

        {info.promociones?.length > 0 && (
          <div style={styles.promoBox}>
            ☕ Además, en este local tenés estos beneficios:
            <ul style={styles.promoList}>
              {info.promociones.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>
        )}

        <div className="match-actions">
          <button className="btn btn-white" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  plazoBox: {
    fontSize: 13, color: '#555', margin: '0 0 12px',
    background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 8, padding: '8px 12px',
    lineHeight: 1.5, textAlign: 'left',
  },
  reminderBox: {
    fontSize: 13, color: '#555', margin: '0 0 12px',
    background: '#f5e6cc', borderRadius: 8, padding: '8px 12px',
    lineHeight: 1.5, textAlign: 'left',
  },
  promoBox: {
    fontSize: 13, color: '#555', margin: '0 0 16px',
    background: '#f0fdf4', border: '1px solid #22c55e', borderRadius: 8, padding: '8px 12px',
    lineHeight: 1.5, textAlign: 'left',
  },
  promoList: {
    margin: '4px 0 0', paddingLeft: 18,
  },
  link: {
    color: 'inherit',
    textDecoration: 'underline',
  },
}
