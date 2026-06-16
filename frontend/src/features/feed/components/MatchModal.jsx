import { useNavigate } from 'react-router-dom'

export function MatchModal({ book, conversationId, onClose }) {
  const navigate = useNavigate()

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="match-modal" onClick={(e) => e.stopPropagation()}>
        <div className="match-emoji">💜</div>
        <h2>¡Es un match!</h2>
        <p>
          Tú y <strong>{book.owner?.name}</strong> se gustaron los libros del otro
        </p>

        {book.coverImageUrl && (
          <img
            className="match-book-cover"
            src={book.coverImageUrl}
            alt={book.title}
          />
        )}

        <div style={styles.puntosHint}>
          💡 Coordiná la entrega en un{' '}
          <button
            style={styles.puntosLink}
            onClick={() => { onClose(); navigate('/puntos-seguros') }}
          >
            Punto Seguro de Trueque
          </button>{' '}
          cercano.
        </div>

        <div className="match-actions">
          <button
            className="btn btn-white"
            onClick={() => {
              onClose()
              navigate(`/chat/${conversationId}`)
            }}
          >
            💬 Empezar a chatear
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  puntosHint: {
    fontSize: 13, color: '#555', margin: '0 0 16px',
    background: '#f5e6cc', borderRadius: 8, padding: '8px 12px',
    lineHeight: 1.5,
  },
  puntosLink: {
    background: 'none', border: 'none', padding: 0,
    color: '#4B0082', fontWeight: 700, cursor: 'pointer',
    fontSize: 13, textDecoration: 'underline',
  },
}
