export function PremiumModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '2.5rem' }}>💎</span>
        <h2 className="auth-prompt-title">Función Premium</h2>
        <p className="auth-prompt-sub">Con el plan premium podés:</p>
        <ul className="premium-features-list">
          <li>💬 <strong>Ofertar directamente</strong> — chateá con quien tenga el libro que querés para llegar a un acuerdo rápido, sin esperar un match</li>
          <li>⭐ <strong>Tus libros aparecen primero</strong> — tus publicaciones se muestran antes que las del resto en los resultados de búsqueda</li>
        </ul>
        <p className="auth-prompt-sub" style={{ marginTop: '0.75rem' }}><strong>Próximamente:</strong></p>
        <ul className="premium-features-list">
          <li>📚 <strong>Accedé a un stock de libros físicos</strong> para leer cuando quieras</li>
          <li>☕ <strong>Accedé a descuentos</strong> en cafeterías y librerías</li>
        </ul>
        <p className="auth-prompt-sub" style={{ marginTop: '0.75rem' }}>Contáctanos para habilitarlo:</p>
        <a
          className="btn btn-primary"
          href="mailto:contacto@truequedelibros.com"
          style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}
        >
          contacto@truequedelibros.com
        </a>
        <a
          className="btn btn-outline"
          href="tel:+542617006897"
          style={{ marginTop: '0.5rem', textDecoration: 'none', display: 'block', textAlign: 'center' }}
        >
          📞 2617006897
        </a>
        <button className="btn btn-outline" onClick={onClose} style={{ marginTop: '0.5rem' }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
