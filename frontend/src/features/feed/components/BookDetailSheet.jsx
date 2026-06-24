import { useEffect } from 'react'
import { genreLabel } from '../../../shared/utils/genreLabel'
import { UserAvatar } from '../../../shared/components/UserAvatar'

export function BookDetailSheet({ book, onClose, onLike, onDislike, onChat, onOffer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const isPuntoSeguro = !!book.puntoSeguro
  const showChatButton = !isPuntoSeguro && (book.venta || book.regalo)

  const handleLike = () => {
    onClose()
    onLike()
  }

  const handleDislike = () => {
    onClose()
    onDislike()
  }

  const handleChat = () => {
    onClose()
    onChat()
  }

  const handleOffer = () => {
    onClose()
    onOffer()
  }

  return (
    <div
      className="book-detail-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={book.title}
    >
      <div className="book-detail-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="book-detail-drag-handle" />

        <div className="book-detail-cover">
          {book.coverImageUrl
            ? <img src={book.coverImageUrl} alt={book.title} />
            : <span className="book-detail-cover-placeholder">📚</span>}
        </div>

        <div className="book-detail-body">
          <h2 className="book-detail-title">{book.title}</h2>
          <p className="book-detail-author">{book.author}</p>

          <div className="book-detail-chips">
            {!isPuntoSeguro && <span className={`book-card-condition condition-${book.condition}`}>{book.condition}</span>}
            {book.genre && <span className="card-genre">{genreLabel(book.genre)}</span>}
          </div>
          {!isPuntoSeguro && (book.trueque || book.regalo || book.venta) && (
            <div className="card-exchange-pills" style={{ marginTop: '0.5rem' }}>
              {book.trueque && <span className="card-exchange-pill">Trueque</span>}
              {book.regalo && <span className="card-exchange-pill">Regalar</span>}
              {book.venta && <span className="card-exchange-pill">Vender</span>}
              {book.venta && book.precio != null && (
                <span className="card-exchange-pill card-price-pill">${Number(book.precio).toLocaleString('es-AR')}</span>
              )}
            </div>
          )}

          {book.description && (
            <div className="book-detail-description-section">
              <p className="book-detail-description-label">Descripción</p>
              <p className="book-detail-description">{book.description}</p>
            </div>
          )}


          {isPuntoSeguro ? (
            <div className="book-detail-owner">
              {book.localLogoUrl
                ? <img src={book.localLogoUrl} alt={book.localName} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '1.75rem' }}>🏪</span>
              }
              <div>
                <p className="book-detail-owner-name">{book.localName}</p>
                {book.localAddress && <p className="book-detail-owner-city">📍 {book.localAddress}</p>}
                {book.distanceKm != null && <p className="book-detail-owner-city">{book.distanceKm.toFixed(1)} km</p>}
              </div>
            </div>
          ) : (
            <div className="book-detail-owner">
              <OwnerAvatar owner={book.owner} />
              <div>
                <p className="book-detail-owner-name">{book.owner?.name}</p>
                {book.owner?.city && (
                  <p className="book-detail-owner-city">📍 {book.owner.city}</p>
                )}
              </div>
            </div>
          )}

          <div className="book-detail-actions">
            <button
              className="action-btn action-btn-dislike book-detail-btn"
              onClick={handleDislike}
              aria-label="No me gusta"
            >
              ✕
            </button>
            {showChatButton ? (
              <button
                className="action-btn action-btn-chat book-detail-btn"
                onClick={handleChat}
                aria-label="Chatear"
              >
                💬
              </button>
            ) : isPuntoSeguro ? null : (
              <button
                className="action-btn action-btn-offer book-detail-btn"
                onClick={handleOffer}
                aria-label="Ofertar"
              >
                $
              </button>
            )}
            <button
              className="action-btn action-btn-like book-detail-btn"
              onClick={handleLike}
              aria-label="Me gusta"
            >
              ♥
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function OwnerAvatar({ owner }) {
  return <UserAvatar name={owner?.name} url={owner?.profilePictureUrl} seed={owner?.name} size={36} />
}
