import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getMatches, getLikesReceived } from '../../../shared/api/matches.api'
import { requestHomeDelivery } from '../../../shared/api/support.api'
import { Spinner } from '../../../shared/components/Spinner'
import { UserAvatar } from '../../../shared/components/UserAvatar'

export function LikesPage() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [received, setReceived] = useState([])
  const [receivedHasMore, setReceivedHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [homeDeliveryStatus, setHomeDeliveryStatus] = useState({})
  const [confirmModal, setConfirmModal] = useState(false)
  const sentinelRef = useRef(null)
  const pageRef = useRef(0)
  const loadMoreRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getMatches(), getLikesReceived(0)])
      .then(([matchRes, likeRes]) => {
        if (cancelled) return
        setMatches(matchRes.data)
        setReceived(likeRes.data.items)
        setReceivedHasMore(likeRes.data.hasMore)
        setTotalCount(likeRes.data.totalCount ?? likeRes.data.items.length)
        pageRef.current = 0
      })
      .catch(() => { if (!cancelled) toast.error('Error al cargar tus trueques') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const loadMoreReceived = useCallback(async () => {
    if (loadingMore || !receivedHasMore) return
    setLoadingMore(true)
    try {
      const nextPage = pageRef.current + 1
      const { data } = await getLikesReceived(nextPage)
      setReceived((prev) => [...prev, ...data.items])
      setReceivedHasMore(data.hasMore)
      pageRef.current = nextPage
    } catch {
      toast.error('Error al cargar más trueques')
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, receivedHasMore])

  loadMoreRef.current = loadMoreReceived

  useEffect(() => {
    if (loading) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMoreRef.current?.() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loading])

  const handleHomeDelivery = async (match) => {
    setHomeDeliveryStatus((prev) => ({ ...prev, [match.id]: 'loading' }))
    try {
      await requestHomeDelivery(match.conversationId)
      setHomeDeliveryStatus((prev) => ({ ...prev, [match.id]: 'sent' }))
      setConfirmModal(true)
    } catch {
      setHomeDeliveryStatus((prev) => ({ ...prev, [match.id]: 'error' }))
    }
  }

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  const isEmpty = matches.length === 0 && received.length === 0

  return (
    <div className="likes-page">
      <h1 className="page-title">Trueques</h1>

      {isEmpty ? (
        <div className="placeholder-page">
          <span style={{ fontSize: '3rem' }}>💚</span>
          <h2>Aún no tienes trueques</h2>
          <p>Cuando alguien se interese en tus libros aparecerá aquí</p>
        </div>
      ) : (
        <>
          {matches.length > 0 && (
            <section className="likes-section">
              <h2 className="likes-section-title">
                <span className="likes-section-dot likes-section-dot--match" />
                Trueques ({matches.length})
              </h2>
              <p className="likes-section-subtitle">
                Aquí se muestran los trueques existentes, ponte en contacto con la persona para
                intercambiar los libros, recuerda que puedes acceder a un punto seguro para dejar
                tu libro o coordinar una reunión.
              </p>
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onClick={() => navigate(`/chat/${match.conversationId}`)}
                  onChat={() => navigate(`/chat/${match.conversationId}`)}
                  homeDeliveryStatus={homeDeliveryStatus[match.id]}
                  onHomeDelivery={() => handleHomeDelivery(match)}
                />
              ))}
            </section>
          )}

          {received.length > 0 && (
            <section className="likes-section">
              <h2 className="likes-section-title">
                <span className="likes-section-dot likes-section-dot--like" />
                Están interesados en intercambiar sus libros ({totalCount > 0 ? totalCount : received.length})
              </h2>
              <p className="likes-section-subtitle">
                Haz clic sobre una de las tarjetas para ver los libros para intercambiar disponibles
                de cada interesado.
              </p>
              {received.map((like, i) => (
                <ReceivedLikeCard
                  key={i}
                  like={like}
                  locked={false}
                  onClick={() => navigate(`/profile/${like.liker.id}`)}
                  onViewBooks={(e) => { e.stopPropagation(); navigate(`/profile/${like.liker.id}`) }}
                />
              ))}
              <div ref={sentinelRef} style={{ height: 1 }} />
              {loadingMore && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                  <Spinner size="sm" />
                </div>
              )}
            </section>
          )}
        </>
      )}

      {confirmModal && (
        <HomeDeliveryConfirmModal onClose={() => setConfirmModal(false)} />
      )}
    </div>
  )
}

function MatchCard({ match, onClick, onChat, homeDeliveryStatus, onHomeDelivery }) {
  const { otherUser, bookYouLiked, bookTheyLiked, createdAt } = match
  return (
    <div className="like-card like-card--match" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="like-card-books">
        <BookThumb book={bookTheyLiked} />
        <span className="like-card-swap">⇄</span>
        <BookThumb book={bookYouLiked} />
      </div>
      <div className="like-card-info">
        <p className="like-card-name">{otherUser.name}</p>
        <p className="like-card-sub">
          Tú quieres «{bookYouLiked.title}» · Ellos quieren «{bookTheyLiked.title}»
        </p>
        <div className="like-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-primary btn-sm like-card-chat-btn" onClick={onChat}>
            Chatear para coordinar el trueque
          </button>
          {homeDeliveryStatus === 'loading' ? (
            <span className="like-card-delivery-link" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Spinner size="sm" /> Enviando...
            </span>
          ) : homeDeliveryStatus === 'sent' ? (
            <span className="like-card-delivery-sent">✓ Solicitud enviada</span>
          ) : (
            <button
              className="like-card-delivery-link"
              onClick={onHomeDelivery}
            >
              Prefiero recibir mi nuevo libro en casa{' '}
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                (Se cobra una tarifa de envío)
              </span>
              {homeDeliveryStatus === 'error' && (
                <span style={{ color: 'var(--color-error)', fontSize: '0.72rem', marginLeft: 4 }}>
                  Error, intentá de nuevo.
                </span>
              )}
            </button>
          )}
        </div>
      </div>
      <span className="like-card-date">{formatDate(createdAt)}</span>
    </div>
  )
}

function ReceivedLikeCard({ like, onClick, onViewBooks, locked }) {
  const { liker, bookLiked, createdAt } = like
  return (
    <div
      className={`like-card like-card--received${locked ? ' like-card--locked' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="like-card-avatar">
        {liker.profilePictureUrl
          ? <img src={liker.profilePictureUrl} alt={liker.name} />
          : <UserAvatar name={liker.name} seed={liker.id} size={44} />}
      </div>
      <div className="like-card-info">
        <p className="like-card-name">{liker.name}</p>
        <p className="like-card-sub">
          Quiere intercambiar «{bookLiked.title}» por uno de los suyos
        </p>
        {liker.city && <p className="like-card-city">📍 {liker.city}</p>}
        {typeof liker.bookCount === 'number' && (
          <p className="like-card-book-count">
            Tiene {liker.bookCount} libro{liker.bookCount !== 1 ? 's' : ''} para intercambiar
          </p>
        )}
        <button className="like-card-view-books-btn" onClick={onViewBooks}>
          Ver los libros de {liker.name}
        </button>
      </div>
      {locked
        ? <span className="like-card-lock">💎</span>
        : <span className="like-card-date">{formatDate(createdAt)}</span>
      }
    </div>
  )
}

function HomeDeliveryConfirmModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '2.5rem' }}>📦</span>
        <h2 className="auth-prompt-title">¡Solicitud enviada!</h2>
        <p className="auth-prompt-sub">
          El equipo de Trueque de Libros se contactará para ayudarte con la gestión del trueque.
        </p>
        <button className="btn btn-primary" onClick={onClose}>Entendido</button>
      </div>
    </div>
  )
}

function BookThumb({ book }) {
  return book?.coverImageUrl
    ? <img className="like-book-thumb" src={book.coverImageUrl} alt={book.title} />
    : <div className="like-book-thumb like-book-thumb--empty">📚</div>
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
