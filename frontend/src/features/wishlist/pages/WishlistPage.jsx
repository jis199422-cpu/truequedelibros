import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { getWishlist, addToWishlist, removeFromWishlist } from '../../../shared/api/wishlist.api'
import { updateNotificationPreferences } from '../../../shared/api/users.api'
import { Spinner } from '../../../shared/components/Spinner'
import useAuthStore from '../../auth/store/authStore'

export function WishlistPage() {
  const { user, accessToken, setAuth } = useAuthStore()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [notifyOnMatch, setNotifyOnMatch] = useState(user?.wishlistNotifyOnMatch ?? true)
  const [notifyExternalPurchase, setNotifyExternalPurchase] = useState(user?.wishlistNotifyExternalPurchase ?? false)
  const inputRef = useRef(null)

  const handlePreferenceChange = async (field, value) => {
    const previous = field === 'wishlistNotifyOnMatch' ? notifyOnMatch : notifyExternalPurchase
    if (field === 'wishlistNotifyOnMatch') setNotifyOnMatch(value)
    else setNotifyExternalPurchase(value)

    try {
      const { data } = await updateNotificationPreferences({ [field]: value })
      setAuth(accessToken, data)
    } catch {
      if (field === 'wishlistNotifyOnMatch') setNotifyOnMatch(previous)
      else setNotifyExternalPurchase(previous)
      toast.error('Error al guardar tus preferencias')
    }
  }

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
      setItems((prev) => [data, ...prev])
      setInput('')
      toast('Se agregó a tu lista. Te avisaremos cuando esté disponible cerca tuyo.', { icon: 'ℹ️' })
      inputRef.current?.focus()
    } catch (err) {
      const msg = err?.response?.data?.message
      toast.error(msg ?? 'Error al agregar el título')
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

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="wishlist-page">
      <h1 className="page-title">Lista de deseos</h1>
      <p className="wishlist-hint">
        Te avisaremos cuando alguien cercano publique un título de tu lista.
      </p>

      <div style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-start',
        background: 'var(--color-info-bg, #eff6ff)',
        border: '1px solid var(--color-info-border, #bfdbfe)',
        borderRadius: '8px',
        color: 'var(--color-info-text, #1e40af)',
        fontSize: '0.82rem',
        padding: '0.6rem 0.75rem',
        marginBottom: '1rem',
        lineHeight: 1.5,
      }}>
        <span style={{ flexShrink: 0 }}>ℹ️</span>
        <span>
          Si el título que agregaste ya está publicado en la plataforma, aparecerá primero en tu{' '}
          <strong>Explorador de libros</strong>. Si todavía no está disponible, te avisaremos en cuanto alguien cercano lo publique.
        </span>
      </div>

      <form className="wishlist-form" onSubmit={handleAdd}>
        <input
          ref={inputRef}
          className="form-input"
          placeholder="Título del libro que buscas…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={255}
          disabled={adding}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm wishlist-add-btn"
          disabled={adding || !input.trim()}
        >
          {adding ? <Spinner size="sm" /> : 'Agregar'}
        </button>
      </form>

      {items.length > 0 && (
        <div className="wishlist-preferences" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.75rem 0 1rem' }}>
          <label className="wishlist-preference-label">
            <input
              type="checkbox"
              checked={notifyOnMatch}
              onChange={(e) => handlePreferenceChange('wishlistNotifyOnMatch', e.target.checked)}
            />
            Enviarme notificaciones por e-mail cuando los libros agregados a mi Lista de deseos sean agregados a trueque de libros.
          </label>
          <label className="wishlist-preference-label">
            <input
              type="checkbox"
              checked={notifyExternalPurchase}
              onChange={(e) => handlePreferenceChange('wishlistNotifyExternalPurchase', e.target.checked)}
            />
            Si no aparecen en trueque de libros, notificarme de opciones de compra en otros sitios.
          </label>
        </div>
      )}

      {items.length === 0 ? (
        <div className="placeholder-page" style={{ height: '50dvh' }}>
          <h2>Tu lista está vacía</h2>
          <p>Agrega títulos que te gustaría leer y te avisaremos cuando alguien los publique</p>
        </div>
      ) : (
        <ul className="wishlist-list">
          {items.map((item) => (
            <li key={item.id} className="wishlist-item">
              <BookIcon />
              <span className="wishlist-item-title">{item.bookTitle}</span>
              <span className="wishlist-item-date">{formatDate(item.createdAt)}</span>
              <button
                className="icon-btn icon-btn-danger wishlist-remove-btn"
                title="Eliminar"
                onClick={() => handleRemove(item.id)}
              >
                <TrashIcon />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
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

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
