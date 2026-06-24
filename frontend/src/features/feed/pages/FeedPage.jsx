import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { trackAuthPromptShown, trackAuthPromptCtaClicked, trackBookLiked } from '../../../shared/utils/metaPixel'
import toast from 'react-hot-toast'
import useAuthStore from '../../auth/store/authStore'
import { getFeed, dislikeBook } from '../../../shared/api/books.api'
import { getDailyLikeStatus } from '../../../shared/api/matches.api'
import { updateLocation } from '../../../shared/api/users.api'
import { getCurrentUser } from '../../../shared/api/auth.api'
import { startOfferConversation, startBookConversation } from '../../../shared/api/conversations.api'
import useLikeGateStore from '../store/likeGateStore'
import useTermsGateStore from '../../terms/store/termsGateStore'
import { useLikeBook } from '../../books/hooks/useLikeBook'
import { SwipeCard } from '../components/SwipeCard'
import { MatchModal } from '../components/MatchModal'
import { PuntoSeguroLikeModal } from '../components/PuntoSeguroLikeModal'
import { BookDetailSheet } from '../components/BookDetailSheet'
import { LocationPermissionModal } from '../components/LocationPermissionModal'
import { PremiumModal } from '../../../shared/components/PremiumModal'
import { LikeGateModal } from '../components/LikeGateModal'
import { TruequeGateModal } from '../components/TruequeGateModal'
import { Spinner } from '../../../shared/components/Spinner'

export function FeedPage() {
  const navigate = useNavigate()
  const accessToken = useAuthStore((s) => s.accessToken)
  const currentUser = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const isGuest = !accessToken
  const setDailyStatus = useLikeGateStore((s) => s.setDailyStatus)
  const hasBooks = useLikeGateStore((s) => s.hasBooks)
  const resetAt = useLikeGateStore((s) => s.resetAt)

  const {
    handleLike: triggerLike, match, clearMatch, directContact, clearDirectContact,
    puntoSeguroInfo, clearPuntoSeguroInfo,
    gateModal, clearGateModal, markWarning,
  } = useLikeBook()

  const autoReloadTriggered = useRef(false)
  const interactedIds = useRef(new Set())
  const cursorRef = useRef(null)

  const [queue, setQueue] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [detailBook, setDetailBook] = useState(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [locationDismissed, setLocationDismissed] = useState(
    () => localStorage.getItem('locationModalDismissed') === 'true'
  )
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [offering, setOffering] = useState(false)
  const [guestCoords, setGuestCoords] = useState(null)
  const [showTruequeGateModal, setShowTruequeGateModal] = useState(false)
  const [truequeOnlyCount, setTruequeOnlyCount] = useState(0)

  const truequeGated = currentUser?.onboardingIntent === 'INTERCAMBIAR' && !hasBooks

  const loadMore = useCallback(async (overrideLat, overrideLng, force = false) => {
    if (!force && !hasMore) return
    try {
      const lat = overrideLat ?? guestCoords?.lat ?? currentUser?.latitude ?? null
      const lng = overrideLng ?? guestCoords?.lng ?? currentUser?.longitude ?? null
      const { data } = await getFeed(cursorRef.current, null, lat, lng)
      const books = Array.isArray(data?.books) ? data.books : []
      cursorRef.current = data?.cursor ?? null
      const hasUninteracted = books.some((b) => !interactedIds.current.has(b.id))
      if (hasUninteracted) autoReloadTriggered.current = false
      setQueue((prev) => {
        const ids = new Set(prev.map((b) => b.id))
        return [...prev, ...books.filter((b) => !ids.has(b.id) && !interactedIds.current.has(b.id))]
      })
      setHasMore(data?.hasMore ?? false)
      setTruequeOnlyCount(data?.truequeOnlyCount ?? 0)
    } catch {
      toast.error('Error al cargar libros')
    }
  }, [hasMore, guestCoords, currentUser])

  useEffect(() => {
    let cancelled = false
    loadMore(undefined, undefined, true).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (showAuthPrompt) trackAuthPromptShown(interactedIds.current.size)
  }, [showAuthPrompt])

  useEffect(() => {
    if (directContact) {
      navigate(`/chat/${directContact.conversationId}`)
      clearDirectContact()
    }
  }, [directContact])

  useEffect(() => {
    if (!isGuest) {
      getDailyLikeStatus()
        .then(({ data }) => {
          setDailyStatus(data.dailyCount, data.dailyLimit, data.isPremium, data.resetAt, data.hasBooks)
        })
        .catch(() => {})
    }
  }, [isGuest])


  useEffect(() => {
    if (!isGuest && !locationDismissed && (!currentUser?.latitude || !currentUser?.longitude)) {
      setShowLocationModal(true)
    }
  }, [])

  useEffect(() => {
    if (queue.length === 0 && !loading && !autoReloadTriggered.current) {
      autoReloadTriggered.current = true
      setLoading(true)
      loadMore(undefined, undefined, true).finally(() => setLoading(false))
    }
  }, [queue.length, loading])

  const removeTop = useCallback(() => {
    setQueue((prev) => prev.slice(1))
  }, [])

  const handleLike = async () => {
    if (isGuest) { setShowAuthPrompt(true); return false }
    if (truequeGated) { setShowTruequeGateModal(true); return false }
    if (!currentUser?.termsAcceptedAt) {
      useTermsGateStore.getState().requireTerms(() => {})
      return false
    }
    const book = queue[0]
    interactedIds.current.add(book.id)
    removeTop()
    if (queue.length - 1 < 3 && hasMore) loadMore()
    trackBookLiked({ bookTitle: book.title, bookGenre: book.genre, ownerUserId: book.owner?.id })
    await triggerLike(book)
  }

  const handleDislike = async () => {
    if (isGuest) { setShowAuthPrompt(true); return false }
    if (truequeGated) { setShowTruequeGateModal(true); return false }
    const book = queue[0]
    interactedIds.current.add(book.id)
    removeTop()
    if (queue.length - 1 < 3 && hasMore) loadMore()
    try {
      await dislikeBook(book.id)
    } catch {}
  }

  const handleOffer = () => {
    if (isGuest) { setShowAuthPrompt(true); return }
    if (truequeGated) { setShowTruequeGateModal(true); return }
    if (!currentUser?.premium) { setShowPremiumModal(true); return }
    const book = queue[0]
    if (!book) return
    useTermsGateStore.getState().requireTerms(() => performOffer(book))
  }

  const performOffer = async (book) => {
    setOffering(true)
    try {
      const { data } = await startOfferConversation(book.owner.id)
      navigate(`/chat/${data.conversationId}`)
    } catch {
      toast.error('Error al iniciar la oferta')
    } finally {
      setOffering(false)
    }
  }

  const handleChat = () => {
    if (isGuest) { setShowAuthPrompt(true); return }
    if (truequeGated) { setShowTruequeGateModal(true); return }
    const book = queue[0]
    if (!book) return
    useTermsGateStore.getState().requireTerms(() => performChat(book))
  }

  const performChat = async (book) => {
    setOffering(true)
    try {
      const { data } = await startBookConversation(book.id)
      navigate(`/chat/${data.conversationId}`, {
        state: { bookHint: { ownerName: book.owner?.name, isVenta: book.venta, isRegalo: book.regalo } },
      })
    } catch {
      toast.error('Error al iniciar el chat')
    } finally {
      setOffering(false)
    }
  }

  const handleLocationSuccess = ({ latitude, longitude }) => {
    if (!isGuest) {
      updateUser({ latitude, longitude })
      updateLocation({ latitude, longitude })
        .then(() => getCurrentUser().then(({ data }) => updateUser(data)))
        .catch(() => toast.error('No pudimos guardar tu ubicación. Intentá de nuevo.'))
      localStorage.removeItem('locationModalDismissed')
      setLocationDismissed(false)
    } else {
      setGuestCoords({ lat: latitude, lng: longitude })
    }
    setShowLocationModal(false)
    cursorRef.current = null
    setQueue([])
    setHasMore(true)
    setLoading(true)
    loadMore(latitude, longitude, true).finally(() => setLoading(false))
  }

  if (loading) return (
    <>
      <div className="spinner-page"><Spinner size="lg" /></div>
      {match && <MatchModal book={match.book} conversationId={match.conversationId} onClose={clearMatch} />}
      {puntoSeguroInfo && <PuntoSeguroLikeModal info={puntoSeguroInfo} onClose={clearPuntoSeguroInfo} />}
    </>
  )

  if (queue.length === 0) {
    return (
      <div className="feed-page-scroll">
        <div className="feed-empty">
          <span style={{ fontSize: '3.5rem' }}>📚</span>
          <h2>¡Has visto todos los libros cercanos!</h2>
          <p>Vuelve pronto para descubrir nuevos libros</p>
          {!isGuest && currentUser?.onboardingIntent === 'INTERCAMBIAR' && !hasBooks && (
            <div className="feed-trueque-warning">
              Agregá un libro para comenzar a hacer trueque.{' '}
              <button className="feed-trueque-warning-link" onClick={() => navigate('/books/new')}>
                ¡Click acá!
              </button>
            </div>
          )}
          {!isGuest && currentUser?.onboardingIntent !== 'INTERCAMBIAR' && truequeOnlyCount > 0 && (
            <div className="feed-trueque-hint">
              Hay {truequeOnlyCount} libro{truequeOnlyCount === 1 ? '' : 's'} para intercambiar. Subí tu primer libro y desbloqueá tu próxima lectura.{' '}
              <button className="feed-trueque-hint-link" onClick={() => navigate('/books/new')}>
                Agregar un libro
              </button>
            </div>
          )}
          <button
            className="btn btn-outline btn-sm"
            style={{ marginTop: '0.5rem', width: 'auto' }}
            onClick={() => { cursorRef.current = null; setLoading(true); loadMore(undefined, undefined, true).finally(() => setLoading(false)) }}
          >
            Recargar
          </button>
        </div>
        {match && <MatchModal book={match.book} conversationId={match.conversationId} onClose={clearMatch} />}
        {puntoSeguroInfo && <PuntoSeguroLikeModal info={puntoSeguroInfo} onClose={clearPuntoSeguroInfo} />}
        {!isGuest && (
          <button className={`feed-fab${!hasBooks ? ' feed-fab--glow' : ''}`} aria-label="Agregar libro" onClick={() => navigate('/books/new')}>+</button>
        )}
      </div>
    )
  }

  const visible = queue.slice(0, 3)
  const topBook = queue[0]
  const isPuntoSeguro = !!topBook?.puntoSeguro
  const showChatButton = !isPuntoSeguro && (topBook?.venta || topBook?.regalo)

  return (
    <div className="feed-page-scroll">
      {!isGuest && locationDismissed && (!currentUser?.latitude || !currentUser?.longitude) && (
        <div style={{
          background: 'var(--color-error-bg, #fff5f5)',
          border: '1px solid var(--color-error, #e53e3e)',
          borderRadius: '8px',
          color: 'var(--color-error, #e53e3e)',
          fontSize: '0.82rem',
          padding: '0.5rem 0.75rem',
          margin: '0.75rem 1rem 0',
          textAlign: 'center',
        }}>
          Para ver los libros más cercanos, activá tu{' '}
          <button
            style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            onClick={() => { setLocationDismissed(false); setShowLocationModal(true) }}
          >
            ubicación
          </button>.
        </div>
      )}

      {isGuest && !guestCoords && (
        <div style={{
          background: 'var(--color-error-bg, #fff5f5)',
          border: '1px solid var(--color-error, #e53e3e)',
          borderRadius: '8px',
          color: 'var(--color-error, #e53e3e)',
          fontSize: '0.82rem',
          padding: '0.5rem 0.75rem',
          margin: '0.75rem 1rem 0',
          textAlign: 'center',
        }}>
          Para ver los libros más cercanos,{' '}
          <button
            style={{ background: 'none', border: 'none', color: 'inherit', fontWeight: 600, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
            onClick={() => setShowLocationModal(true)}
          >
            activá tu ubicación
          </button>.
        </div>
      )}
      {!isGuest && currentUser?.onboardingIntent === 'INTERCAMBIAR' && !hasBooks && (
        <div className="feed-trueque-warning" style={{ margin: '0.75rem 1rem 0' }}>
          Agregá un libro para comenzar a hacer trueque.{' '}
          <button className="feed-trueque-warning-link" onClick={() => navigate('/books/new')}>
            ¡Click acá!
          </button>
        </div>
      )}
    <div className="feed-container">

      <div className="card-stack">
        {[...visible].reverse().map((book, i, arr) => (
          <SwipeCard
            key={book.id}
            book={book}
            stackIndex={arr.length - 1 - i}
            onSwipeRight={handleLike}
            onSwipeLeft={handleDislike}
            onTap={arr.length - 1 - i === 0 ? () => setDetailBook(book) : undefined}
          />
        ))}
      </div>

      <div className="feed-actions">
        <div className="action-btn-wrap">
          <button className="action-btn action-btn-dislike" onClick={handleDislike} aria-label="No me interesa">
            ✕
          </button>
          <span className="action-btn-label">No me interesa</span>
        </div>
        {showChatButton ? (
          <div className="action-btn-wrap">
            <button className="action-btn action-btn-chat" onClick={handleChat} disabled={offering} aria-label={topBook?.venta ? 'Chatear con el vendedor' : 'Chatear'}>
              {offering ? <Spinner size="sm" /> : '💬'}
            </button>
            <span className="action-btn-label">{topBook?.venta ? 'Chatear con el vendedor' : 'Chatear'}</span>
          </div>
        ) : isPuntoSeguro ? (
          <div className="action-btn-wrap">
            <button className="action-btn action-btn-like" onClick={handleLike} aria-label="Me interesa">
              ♥
            </button>
            <span className="action-btn-label">Me interesa</span>
          </div>
        ) : (
          <>
            <div className="action-btn-wrap">
              <button className="action-btn action-btn-offer" onClick={handleOffer} disabled={offering} aria-label="Lo quiero ya!">
                $
              </button>
              <span className="action-btn-label">Lo quiero ya!</span>
            </div>
            <div className="action-btn-wrap">
              <button className="action-btn action-btn-like" onClick={handleLike} aria-label="Quiero hacer trueque">
                ♥
              </button>
              <span className="action-btn-label">Quiero hacer trueque</span>
            </div>
          </>
        )}
      </div>

      {detailBook && (
        <BookDetailSheet
          book={detailBook}
          onClose={() => setDetailBook(null)}
          onLike={handleLike}
          onDislike={handleDislike}
          onChat={handleChat}
          onOffer={handleOffer}
        />
      )}

      {match && (
        <MatchModal
          book={match.book}
          conversationId={match.conversationId}
          onClose={clearMatch}
        />
      )}

      {puntoSeguroInfo && (
        <PuntoSeguroLikeModal info={puntoSeguroInfo} onClose={clearPuntoSeguroInfo} />
      )}

      {showAuthPrompt && (
        <AuthPromptModal
          onClose={() => setShowAuthPrompt(false)}
          onRegister={() => { trackAuthPromptCtaClicked(interactedIds.current.size); navigate('/register', { state: { source: 'auth_prompt_modal' } }) }}
          onLogin={() => navigate('/login')}
        />
      )}

      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}

      {gateModal && (
        <LikeGateModal
          mode={gateModal}
          resetAt={resetAt}
          onDismiss={() => { markWarning(); clearGateModal() }}
          onAddBook={() => { clearGateModal(); navigate('/books/new') }}
          onPremium={() => { clearGateModal(); setShowPremiumModal(true) }}
          onWait={() => clearGateModal()}
        />
      )}

      {showLocationModal && (
        <LocationPermissionModal
          onSuccess={handleLocationSuccess}
          onDismiss={() => { localStorage.setItem('locationModalDismissed', 'true'); setShowLocationModal(false); setLocationDismissed(true) }}
        />
      )}

      {showTruequeGateModal && (
        <TruequeGateModal
          onClose={() => setShowTruequeGateModal(false)}
          onAddBook={() => { setShowTruequeGateModal(false); navigate('/books/new') }}
        />
      )}


    </div>
    {!isGuest && (
      <button className={`feed-fab${!hasBooks ? ' feed-fab--glow' : ''}`} aria-label="Agregar libro" onClick={() => navigate('/books/new')}>+</button>
    )}
    </div>
  )
}


function AuthPromptModal({ onClose, onRegister, onLogin }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <span style={{ fontSize: '2.5rem' }}>📚</span>
        <h2 className="auth-prompt-title">¡Únete para intercambiar!</h2>
        <p className="auth-prompt-sub">Creá tu cuenta gratis y empezá a intercambiar libros con personas cerca tuyo.</p>
        <button className="btn btn-primary" onClick={onRegister}>Crear cuenta</button>
        <button className="btn btn-outline" onClick={onLogin} style={{ marginTop: '0.5rem' }}>
          Ya tengo cuenta
        </button>
      </div>
    </div>
  )
}
