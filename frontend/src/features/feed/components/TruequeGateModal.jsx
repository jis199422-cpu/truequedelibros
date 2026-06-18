export function TruequeGateModal({ onClose, onAddBook }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '2.5rem' }}>🔄</span>
        <h2 className="auth-prompt-title">¡Necesitás un libro para hacer trueques!</h2>
        <p className="auth-prompt-sub">Agregá al menos un libro para empezar a intercambiar con otros lectores.</p>
        <button className="btn btn-primary" onClick={onAddBook}>Agregar mi primer libro</button>
        <button className="btn btn-outline" onClick={onClose} style={{ marginTop: '0.5rem' }}>Cerrar</button>
      </div>
    </div>
  )
}
