import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../../auth/store/authStore'
import useTermsGateStore from '../../terms/store/termsGateStore'
import { getPublicProfile, updateLocation, updateNotificationPreferences } from '../../../shared/api/users.api'
import { updateBook, deleteBook } from '../../../shared/api/books.api'
import { getWishlist, addToWishlist, removeFromWishlist } from '../../../shared/api/wishlist.api'
import { startBookConversation } from '../../../shared/api/conversations.api'
import { logout } from '../../../shared/api/auth.api'
import { trackWishlistItemAdded } from '../../../shared/utils/metaPixel'
import { useLikeBook } from '../../books/hooks/useLikeBook'
import { MatchModal } from '../../feed/components/MatchModal'
import { Spinner } from '../../../shared/components/Spinner'
import { Tooltip } from '../../../shared/components/Tooltip'
import { UserAvatar } from '../../../shared/components/UserAvatar'

export function ProfileRoute() {
  const { userId } = useParams()
  return <ProfilePage key={userId} />
}

function ProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const actualId = userId === 'me' ? currentUser?.id : userId
  const isOwn = userId === 'me' || userId === currentUser?.id

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!actualId) return
    let cancelled = false
    getPublicProfile(actualId)
      .then(({ data }) => { if (!cancelled) setProfile(data) })
      .catch(() => { if (!cancelled) toast.error('No se pudo cargar el perfil') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [actualId])

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await updateLocation({ latitude: coords.latitude, longitude: coords.longitude })
          toast.success('Ubicación actualizada')
        } catch {
          toast.error('Error al actualizar la ubicación')
        } finally {
          setLocating(false)
        }
      },
      () => {
        toast.error('No se pudo obtener tu ubicación')
        setLocating(false)
      }
    )
  }

  const handleLogout = async () => {
    try { await logout() } catch {}
    clearAuth()
    navigate('/login', { replace: true })
  }

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>
  if (!profile) return null

  return (
    <div className="profile-page">
      <div className="profile-header">
        <Avatar name={profile.name} url={profile.profilePictureUrl} />
        <h1 className="profile-name">
          {profile.name}
          {profile.premium && (
            <Tooltip text="Usuario premium">
              <span className="premium-crown">👑</span>
            </Tooltip>
          )}
        </h1>
        {profile.bio && <p className="profile-bio">{profile.bio}</p>}
        {profile.city && <p className="profile-city"><span>📍</span> {profile.city}</p>}

        {isOwn && (
          currentUser?.termsAcceptedAt ? (
            <p className="profile-terms-status">
              ✓ Ha aceptado los términos y condiciones de la plataforma ({formatDate(currentUser.termsAcceptedAt)})
            </p>
          ) : (
            <button
              type="button"
              className="profile-terms-link"
              style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary, #4B0082)', textDecoration: 'underline', fontSize: '0.85rem', cursor: 'pointer' }}
              onClick={() => useTermsGateStore.getState().requireTerms(() => {})}
            >
              Aceptar Términos y condiciones de la plataforma
            </button>
          )
        )}

        {isOwn && (
          <div className="profile-actions">
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile/edit')}>
              Editar perfil
            </button>
            <button className="location-btn" onClick={handleUpdateLocation} disabled={locating}>
              {locating ? <Spinner size="sm" /> : '📍'}
              {locating ? 'Obteniendo...' : 'Actualizar ubicación'}
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {isOwn ? (
        <OwnProfileTabs
          books={profile.books ?? []}
          navigate={navigate}
          onboardingIntent={currentUser?.onboardingIntent}
        />
      ) : (
        <OtherUserBooks name={profile.name} books={profile.books ?? []} />
      )}
    </div>
  )
}

function OwnProfileTabs({ books: initialBooks, navigate, onboardingIntent }) {
  const [activeTab, setActiveTab] = useState('books')
  const [books, setBooks] = useState(initialBooks)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const handleToggleStatus = async (book) => {
    const newStatus = book.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
    try {
      await updateBook(book.id, { status: newStatus })
      setBooks((prev) => prev.map((b) => b.id === book.id ? { ...b, status: newStatus } : b))
    } catch {
      toast.error('Error al actualizar el estado')
    }
  }

  const handleDelete = async (bookId) => {
    if (!confirm('¿Eliminar este libro?')) return
    try {
      await deleteBook(bookId)
      setBooks((prev) => prev.filter((b) => b.id !== bookId))
      toast.success('Libro eliminado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar el libro')
    }
  }

  return (
    <>
      <div className="profile-tabs">
        <button
          className={`profile-tab${activeTab === 'books' ? ' profile-tab--active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          Mis libros ({books.length})
        </button>
        <button
          className={`profile-tab${activeTab === 'wishlist' ? ' profile-tab--active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          Lista de deseos
        </button>
        <button
          className={`profile-tab${activeTab === 'notifications' ? ' profile-tab--active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          Notificaciones
        </button>
      </div>

      {activeTab === 'books' && (
        <div className="profile-tab-content">
          {!bannerDismissed && books.length > 0 && books.every(b => b.status !== 'AVAILABLE') && (
            <div className="no-books-banner">
              <span>No tienes libros disponibles para trueque, agrega un libro para intercambiar.</span>
              <button className="no-books-banner-action" onClick={() => navigate('/books/new')}>Agregar libro</button>
              <button className="no-books-banner-close" onClick={() => setBannerDismissed(true)} aria-label="Cerrar">✕</button>
            </div>
          )}
          <div className="my-books-header" style={{ marginBottom: '1rem' }}>
            <span />
            <button
              className={`add-btn${books.every(b => b.status !== 'AVAILABLE') ? ' add-btn--glow' : ''}`}
              onClick={() => navigate('/books/new')}
              aria-label="Agregar libro"
            >+</button>
          </div>
          {books.length === 0 ? (
            <div className="placeholder-page" style={{ height: '40dvh' }}>
              <h2>Aún no tienes libros</h2>
              <p>
                {onboardingIntent === 'INTERCAMBIAR'
                  ? 'Estás a un paso de empezar a hacer trueques. Subí el libro que querés intercambiar.'
                  : 'Agregá tus libros para vender, regalar o intercambiar.'}
              </p>
              <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', width: 'auto' }}
                onClick={() => navigate('/books/new')}>
                Agregar libro
              </button>
            </div>
          ) : (
            books.map((book) => (
              <div key={book.id} className="my-book-card">
                <div className="my-book-thumb">
                  {book.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} /> : '📚'}
                </div>
                <div className="my-book-info">
                  <p className="my-book-title">{book.title}</p>
                  <p className="my-book-author">{book.author}</p>
                  {book.description && (
                    <p className="book-card-description">{book.description}</p>
                  )}
                  <div className="my-book-meta">
                    <span className={`book-card-condition condition-${book.condition}`}>{book.condition}</span>
                    <span className={`status-chip status-${book.status}`}>
                      {book.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'}
                    </span>
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
                </div>
                <div className="my-book-actions">
                  <button className="icon-btn" title="Cambiar disponibilidad" onClick={() => handleToggleStatus(book)}>
                    {book.status === 'AVAILABLE' ? '👁' : '🚫'}
                  </button>
                  <button className="icon-btn" title="Editar" onClick={() => navigate(`/books/${book.id}/edit`)}>
                    <EditIcon />
                  </button>
                  <button className="icon-btn icon-btn-danger" title="Eliminar" onClick={() => handleDelete(book.id)}>
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'wishlist' && <WishlistTab onOpenNotifications={() => setActiveTab('notifications')} />}
      {activeTab === 'notifications' && <NotificationsTab />}
    </>
  )
}

function WishlistTab({ onOpenNotifications }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    getWishlist()
      .then(({ data }) => { if (!cancelled) setItems(data) })
      .catch(() => { if (!cancelled) toast.error('Error al cargar la lista de deseos') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    const title = input.trim()
    if (!title) return
    setAdding(true)
    try {
      const { data } = await addToWishlist(title)
      trackWishlistItemAdded({ bookTitle: title, source: 'profile' })
      setItems((prev) => [data, ...prev])
      setInput('')
      inputRef.current?.focus()
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Error al agregar el título')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (id) => {
    try {
      await removeFromWishlist(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch {
      toast.error('Error al eliminar el título')
    }
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Spinner size="md" /></div>

  return (
    <div className="profile-tab-content">
      <p className="wishlist-hint">Te avisaremos cuando alguien cercano publique un título de tu lista.</p>
      <button
        type="button"
        onClick={onOpenNotifications}
        style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary, #4B0082)', textDecoration: 'underline', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '0.75rem' }}
      >
        Cambiar opciones de envío de notificaciones
      </button>
      <form className="wishlist-form" onSubmit={handleAdd}>
        <input
          ref={inputRef}
          className="form-input"
          placeholder="Título del libro que buscás…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={255}
          disabled={adding}
        />
        <button type="submit" className="btn btn-primary btn-sm wishlist-add-btn"
          disabled={adding || !input.trim()}>
          {adding ? <Spinner size="sm" /> : 'Agregar'}
        </button>
      </form>
      {items.length === 0 ? (
        <div className="placeholder-page" style={{ height: '35dvh' }}>
          <h2>Tu lista está vacía</h2>
          <p>Agregá títulos que te gustaría leer</p>
        </div>
      ) : (
        <ul className="wishlist-list">
          {items.map((item) => (
            <li key={item.id} className="wishlist-item">
              <BookIcon />
              <span className="wishlist-item-title">{item.bookTitle}</span>
              <span className="wishlist-item-date">{formatDate(item.createdAt)}</span>
              <button className="icon-btn icon-btn-danger" title="Eliminar" onClick={() => handleRemove(item.id)}>
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NotificationsTab() {
  const { user, accessToken, setAuth } = useAuthStore()
  const [prefs, setPrefs] = useState({
    wishlistNotifyOnMatch: user?.wishlistNotifyOnMatch ?? true,
    wishlistNotifyExternalPurchase: user?.wishlistNotifyExternalPurchase ?? false,
    notifyOnNewMessage: user?.notifyOnNewMessage ?? true,
    notifyOnBookLike: user?.notifyOnBookLike ?? true,
  })

  const handleChange = async (field, value) => {
    const previous = prefs[field]
    setPrefs((p) => ({ ...p, [field]: value }))
    try {
      const { data } = await updateNotificationPreferences({ [field]: value })
      setAuth(accessToken, data)
    } catch {
      setPrefs((p) => ({ ...p, [field]: previous }))
      toast.error('Error al guardar tus preferencias')
    }
  }

  return (
    <div className="profile-tab-content">
      <div className="wishlist-preferences" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <label className="wishlist-preference-label">
          <input
            type="checkbox"
            checked={prefs.wishlistNotifyOnMatch}
            onChange={(e) => handleChange('wishlistNotifyOnMatch', e.target.checked)}
          />
          Enviarme notificaciones por e-mail cuando los libros agregados a mi Lista de deseos sean agregados a trueque de libros.
        </label>
        <label className="wishlist-preference-label">
          <input
            type="checkbox"
            checked={prefs.wishlistNotifyExternalPurchase}
            onChange={(e) => handleChange('wishlistNotifyExternalPurchase', e.target.checked)}
          />
          Si no aparecen en trueque de libros, notificarme de opciones de compra en otros sitios.
        </label>
        <label className="wishlist-preference-label">
          <input
            type="checkbox"
            checked={prefs.notifyOnNewMessage}
            onChange={(e) => handleChange('notifyOnNewMessage', e.target.checked)}
          />
          Recibir email cuando alguien me envíe un mensaje.
        </label>
        <label className="wishlist-preference-label">
          <input
            type="checkbox"
            checked={prefs.notifyOnBookLike}
            onChange={(e) => handleChange('notifyOnBookLike', e.target.checked)}
          />
          Recibir email cuando alguien le dé like a mi libro.
        </label>
      </div>
    </div>
  )
}

function OtherUserBooks({ name, books }) {
  const navigate = useNavigate()
  const { handleLike, match, clearMatch, liking } = useLikeBook()
  const [chattingId, setChattingId] = useState(null)
  const [detailBook, setDetailBook] = useState(null)
  const [likedIds, setLikedIds] = useState(
    () => new Set(books.filter((b) => b.likedByCurrentUser).map((b) => b.id))
  )

  const availableBooks = books.filter(b => b.status === 'AVAILABLE')

  const handleLikeClick = (book) => {
    useTermsGateStore.getState().requireTerms(() => {
      setLikedIds((prev) => new Set(prev).add(book.id))
      handleLike(book)
    })
  }

  const handleChat = (book) => {
    useTermsGateStore.getState().requireTerms(() => performChat(book))
  }

  const performChat = async (book) => {
    setChattingId(book.id)
    try {
      const { data } = await startBookConversation(book.id)
      navigate(`/chat/${data.conversationId}`, {
        state: { bookHint: { ownerName: name, isVenta: book.venta, isRegalo: book.regalo } },
      })
    } catch {
      toast.error('Error al iniciar el chat')
    } finally {
      setChattingId(null)
    }
  }

  return (
    <>
      <p className="section-title">
        Libros de {name}{' '}
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>({availableBooks.length})</span>
      </p>
      {availableBooks.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Este usuario no tiene libros disponibles.
        </p>
      ) : (
        <div className="books-grid">
          {availableBooks.map((book) => {
            const isChatBook = book.venta || book.regalo
            return (
              <BookCard
                key={book.id}
                book={book}
                onOpenDetail={() => setDetailBook(book)}
                onLike={!isChatBook ? () => handleLikeClick(book) : undefined}
                onChat={isChatBook ? () => handleChat(book) : undefined}
                liking={liking}
                liked={likedIds.has(book.id)}
                chatting={chattingId === book.id}
              />
            )
          })}
        </div>
      )}
      {match && (
        <MatchModal
          book={match.book}
          conversationId={match.conversationId}
          onClose={clearMatch}
        />
      )}
      {detailBook && (
        <BookDescriptionModal book={detailBook} onClose={() => setDetailBook(null)} />
      )}
    </>
  )
}

function Avatar({ name, url }) {
  return <UserAvatar name={name} url={url} seed={name} />
}

function BookCard({ book, onOpenDetail, onLike, onChat, liking, liked, chatting }) {
  return (
    <div className="book-card" onClick={onOpenDetail} style={onOpenDetail ? { cursor: 'pointer' } : undefined}>
      <div className="book-card-cover">
        {book.coverImageUrl ? <img src={book.coverImageUrl} alt={book.title} /> : <span>📚</span>}
      </div>
      <div className="book-card-body">
        <p className="book-card-title">{book.title}</p>
        <p className="book-card-author">{book.author}</p>
        {book.description && (
          <p className="book-card-description">{book.description}</p>
        )}
        <span className={`book-card-condition condition-${book.condition}`}>{book.condition}</span>
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
      </div>
      {(onLike || onChat) && (
        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
          {onLike && (
            liked ? (
              <span className="liked-badge" style={{ flex: 1 }}>♥ Ya te gusta</span>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={onLike}
                disabled={liking}
              >
                ♥ Me gusta
              </button>
            )
          )}
          {onChat && (
            <button
              className="btn btn-primary btn-sm"
              style={{ flex: 1 }}
              onClick={onChat}
              disabled={chatting}
            >
              {chatting ? <Spinner size="sm" /> : '💬 Chatear'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function BookDescriptionModal({ book, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
          {book.description && (
            <div className="book-detail-description-section">
              <p className="book-detail-description-label">Descripción</p>
              <p className="book-detail-description">{book.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg className="wishlist-book-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
