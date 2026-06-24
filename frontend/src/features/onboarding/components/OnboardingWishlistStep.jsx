import { useState } from 'react'
import toast from 'react-hot-toast'
import { addToWishlist } from '../../../shared/api/wishlist.api'
import { updateNotificationPreferences } from '../../../shared/api/users.api'
import { trackWishlistItemAdded } from '../../../shared/utils/metaPixel'
import { Spinner } from '../../../shared/components/Spinner'
import useAuthStore from '../../auth/store/authStore'

export function OnboardingWishlistStep({ onDone }) {
  const { user, accessToken, setAuth } = useAuthStore()
  const [title, setTitle] = useState('')
  const [items, setItems] = useState([])
  const [adding, setAdding] = useState(false)
  const [notifyOnMatch, setNotifyOnMatch] = useState(user?.wishlistNotifyOnMatch ?? true)
  const [notifyExternalPurchase, setNotifyExternalPurchase] = useState(user?.wishlistNotifyExternalPurchase ?? false)

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

  const handleAdd = async () => {
    const trimmed = title.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      await addToWishlist(trimmed)
      trackWishlistItemAdded({ bookTitle: trimmed, source: 'onboarding' })
      setItems((prev) => [...prev, trimmed])
      setTitle('')
    } catch {
      toast.error('No se pudo agregar el libro')
    } finally {
      setAdding(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd() }
  }

  return (
    <div className="form-stack">
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
        Te avisamos cuando alguien tenga un libro que estás buscando.
      </p>
      <div className="onboarding-wishlist-input-row">
        <input
          className="form-input"
          placeholder="Ej: Cien años de soledad"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKey}
          disabled={adding}
        />
        <button className="btn btn-primary btn-sm" type="button" onClick={handleAdd} disabled={adding || !title.trim()}>
          {adding ? <Spinner size="sm" /> : 'Agregar'}
        </button>
      </div>
      {items.length > 0 && (
        <ul className="onboarding-wishlist-list">
          {items.map((item, i) => (
            <li key={i} className="onboarding-wishlist-tag">📚 {item}</li>
          ))}
        </ul>
      )}
      {items.length > 0 && (
        <div className="wishlist-preferences" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
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
      <button className="btn btn-primary" type="button" onClick={onDone}>
        Ir al Feed
      </button>
      {items.length === 0 && (
        <button className="onboarding-skip-btn" type="button" onClick={onDone}>
          Omitir
        </button>
      )}
    </div>
  )
}
