import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { createBook, getBookUploadUrl } from '../../../shared/api/books.api'
import { updateLocation, uploadToS3 } from '../../../shared/api/users.api'
import { trackFirstBookUploaded } from '../../../shared/utils/metaPixel'
import { resizeImage } from '../../../shared/utils/imageResize'
import { useGenres } from '../../books/hooks/useGenres'
import useAuthStore from '../../auth/store/authStore'
import useLikeGateStore from '../../feed/store/likeGateStore'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { Spinner } from '../../../shared/components/Spinner'

const CONDITIONS = ['NUEVO', 'BUENO', 'USADO']

export function OnboardingBookStep({ intent, onDone }) {
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const setHasBooks = useLikeGateStore((s) => s.setHasBooks)
  const { genres } = useGenres()
  const fileRef = useRef(null)
  const [locating, setLocating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverPreview, setCoverPreview] = useState(null)
  const [form, setForm] = useState({
    title: '',
    author: '',
    genre: '',
    condition: 'BUENO',
    description: '',
    coverImageUrl: '',
    trueque: intent === 'INTERCAMBIAR',
    venta: intent === 'VENDER',
    regalo: false,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Solo se permiten imágenes'); return }
    setUploading(true)
    let resized = file
    try {
      resized = await resizeImage(file)
    } catch {
      // si falla el resize, se sube el archivo original
    }
    setCoverPreview(URL.createObjectURL(resized))
    try {
      const { data } = await getBookUploadUrl({ fileName: resized.name, contentType: resized.type })
      await uploadToS3(data.uploadUrl, resized)
      setForm((prev) => ({ ...prev, coverImageUrl: data.imageUrl }))
    } catch {
      toast('No se pudo subir la imagen, podés guardar igual sin portada', { icon: '⚠️' })
    } finally {
      setUploading(false)
    }
  }

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await updateLocation({ latitude: coords.latitude, longitude: coords.longitude })
          updateUser({ latitude: coords.latitude, longitude: coords.longitude })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.genre) { toast.error('El género es obligatorio'); return }
    setSaving(true)
    try {
      await createBook(form)
      trackFirstBookUploaded({ intent, bookTitle: form.title, bookGenre: form.genre })
      updateUser({ hasBooks: true })
      setHasBooks(true)
      toast.success('¡Libro agregado!')
      onDone()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar el libro')
    } finally {
      setSaving(false)
    }
  }

  if (!user?.latitude) {
    return (
      <div className="onboarding-book-location">
        <span style={{ fontSize: '2.5rem' }}>📍</span>
        <p style={{ textAlign: 'center', fontWeight: 600, marginTop: '0.5rem' }}>
          Necesitamos tu ubicación
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 1.25rem' }}>
          Para que otros lectores cercanos puedan encontrar tu libro.
        </p>
        <button className="btn btn-primary" onClick={handleRequestLocation} disabled={locating}>
          {locating ? <Spinner size="sm" /> : '📍'}{' '}
          {locating ? 'Obteniendo ubicación...' : 'Permitir ubicación'}
        </button>
        <button className="onboarding-skip-btn" type="button" onClick={onDone} disabled={locating}>
          Saltar por ahora
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="form-stack">
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div
          className="cover-upload"
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          {uploading ? <Spinner size="md" /> : coverPreview ? (
            <>
              <img src={coverPreview} alt="Portada" />
              <div className="cover-upload-overlay">Cambiar</div>
            </>
          ) : (
            <>
              <span className="cover-upload-icon">📸</span>
              <span>Portada</span>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>Opcional</span>
            </>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>

        <div className="form-stack" style={{ flex: 1 }}>
          <Input label="Título del libro" name="title" value={form.title} onChange={handleChange} placeholder="Ej: El nombre del viento" required />
          <Input label="Autor" name="author" value={form.author} onChange={handleChange} placeholder="Ej: Patrick Rothfuss" required />
          <div className="form-field">
            <label className="form-label">Género</label>
            <select className="form-input" name="genre" value={form.genre} onChange={handleChange}>
              <option value="">Seleccioná un género</option>
              {genres.map((g) => (
                <option key={g.name} value={g.name}>{g.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Estado del libro</label>
        <div className="condition-selector">
          {CONDITIONS.map((c) => (
            <div key={c} className="condition-option">
              <input type="radio" id={`ob-cond-${c}`} name="condition" value={c} checked={form.condition === c} onChange={handleChange} />
              <label htmlFor={`ob-cond-${c}`}>{c}</label>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" loading={saving} disabled={uploading}>Agregar libro</Button>
      <button type="button" className="onboarding-skip-btn" onClick={onDone} disabled={saving || uploading}>
        Saltar por ahora
      </button>
    </form>
  )
}
