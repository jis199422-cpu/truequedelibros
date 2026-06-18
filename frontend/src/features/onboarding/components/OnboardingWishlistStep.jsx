import { useState } from 'react'
import toast from 'react-hot-toast'
import { addToWishlist } from '../../../shared/api/wishlist.api'
import { trackWishlistItemAdded } from '../../../shared/utils/metaPixel'
import { Spinner } from '../../../shared/components/Spinner'

export function OnboardingWishlistStep({ onDone }) {
  const [title, setTitle] = useState('')
  const [items, setItems] = useState([])
  const [adding, setAdding] = useState(false)

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
