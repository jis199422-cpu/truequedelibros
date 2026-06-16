import { useRef, useState, useEffect } from 'react'
import { genreLabel } from '../../../shared/utils/genreLabel'
import { UserAvatar } from '../../../shared/components/UserAvatar'

const THRESHOLD = 80
const DRAG_MIN = 20

export function SwipeCard({ book, stackIndex, onSwipeRight, onSwipeLeft, onTap }) {
  const startRef = useRef(null)
  const offsetRef = useRef({ x: 0, y: 0 })
  const draggedRef = useRef(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [leaving, setLeaving] = useState(null) // 'right' | 'left' | null
  const isTop = stackIndex === 0

  useEffect(() => {
    if (leaving === 'right') {
      const t = setTimeout(onSwipeRight, 320)
      return () => clearTimeout(t)
    }
    if (leaving === 'left') {
      const t = setTimeout(onSwipeLeft, 320)
      return () => clearTimeout(t)
    }
  }, [leaving])

  const onDown = (e) => {
    if (!isTop || leaving) return
    draggedRef.current = false
    startRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onMove = (e) => {
    if (!startRef.current) return
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    offsetRef.current = { x: dx, y: dy }
    setOffset({ x: dx, y: dy })
    if (Math.abs(dx) > DRAG_MIN || Math.abs(dy) > DRAG_MIN) {
      draggedRef.current = true
    }
  }

  const onUp = () => {
    if (!startRef.current) return
    const { x, y } = offsetRef.current
    const wasDrag = draggedRef.current
    startRef.current = null
    offsetRef.current = { x: 0, y: 0 }
    draggedRef.current = false

    if (!wasDrag) {
      setOffset({ x: 0, y: 0 })
      onTap?.()
      return
    }

    if (x > THRESHOLD) {
      setLeaving('right')
    } else if (x < -THRESHOLD) {
      setLeaving('left')
    } else {
      setOffset({ x: 0, y: 0 })
    }
  }

  const onCancel = () => {
    if (!startRef.current) return
    startRef.current = null
    offsetRef.current = { x: 0, y: 0 }
    draggedRef.current = false
    setOffset({ x: 0, y: 0 })
  }

  const getTransform = () => {
    if (leaving === 'right') return `translate(680px, ${offset.y}px) rotate(30deg)`
    if (leaving === 'left') return `translate(-680px, ${offset.y}px) rotate(-30deg)`
    if (startRef.current || offset.x !== 0 || offset.y !== 0) {
      return `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 20}deg)`
    }
    if (stackIndex === 1) return 'scale(0.95) translateY(16px)'
    if (stackIndex === 2) return 'scale(0.90) translateY(32px)'
    return 'none'
  }

  const likeOpacity = offset.x > 10 ? Math.min(offset.x / THRESHOLD, 1) : 0
  const nopeOpacity = offset.x < -10 ? Math.min(-offset.x / THRESHOLD, 1) : 0

  const isDragging = startRef.current !== null

  return (
    <div
      className="swipe-card"
      style={{
        zIndex: 10 - stackIndex,
        transform: getTransform(),
        transition: isDragging || leaving ? 'none' : 'transform 0.35s ease',
        cursor: isTop ? (isDragging ? 'grabbing' : 'grab') : 'default',
        touchAction: 'none',
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onCancel}
    >
      <div className="card-like-badge" style={{ opacity: likeOpacity }}>LIKE</div>
      <div className="card-nope-badge" style={{ opacity: nopeOpacity }}>NOPE</div>

      <div className="card-cover">
        {book.coverImageUrl
          ? <img src={book.coverImageUrl} alt={book.title} />
          : '📚'}
      </div>

      <div className="card-body">
        {isTop && onTap && (
          <button
            className="card-tap-hint"
            aria-label="Ver detalles"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onTap() }}
          >ⓘ</button>
        )}
        <p className="card-title">{book.title}</p>
        <p className="card-author">{book.author}</p>
        <div className="card-tags">
          <span className={`book-card-condition condition-${book.condition}`}>{book.condition}</span>
          {book.genre && <span className="card-genre">{genreLabel(book.genre)}</span>}
        </div>
        {(book.trueque || book.regalo || book.venta) && (
          <div className="card-exchange-pills">
            {book.trueque && <span className="card-exchange-pill">Trueque</span>}
            {book.regalo && <span className="card-exchange-pill">Regalar</span>}
            {book.venta && <span className="card-exchange-pill">Vender</span>}
            {book.venta && book.precio != null && (
              <span className="card-exchange-pill card-price-pill">${Number(book.precio).toLocaleString('es-AR')}</span>
            )}
          </div>
        )}
        {book.description && (
          <p className="card-description">{book.description}</p>
        )}
        <div className="card-owner">
          <OwnerAvatar owner={book.owner} />
          <div>
            <p className="card-owner-name">{book.owner?.name}</p>
            {book.owner?.city && <p className="card-owner-city">📍 {book.owner.city}</p>}
            {book.distanceKm != null && (
              <p className="card-owner-city">{book.distanceKm.toFixed(1)} km</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function OwnerAvatar({ owner }) {
  return <UserAvatar name={owner?.name} url={owner?.profilePictureUrl} seed={owner?.name} size={32} />
}
