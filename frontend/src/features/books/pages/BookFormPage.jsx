import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getBook, createBook, updateBook, getBookUploadUrl } from '../../../shared/api/books.api'
import { uploadToS3, updateLocation } from '../../../shared/api/users.api'
import { trackFirstBookUploaded } from '../../../shared/utils/metaPixel'
import { resizeImage } from '../../../shared/utils/imageResize'
import { useGenres } from '../hooks/useGenres'
import { Button } from '../../../shared/components/Button'
import { Input } from '../../../shared/components/Input'
import { Spinner } from '../../../shared/components/Spinner'
import useAuthStore from '../../auth/store/authStore'
import useLikeGateStore from '../../feed/store/likeGateStore'

const CONDITIONS = ['NUEVO', 'BUENO', 'USADO']

export function BookFormPage() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const isEdit = !!bookId
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const setHasBooks = useLikeGateStore((s) => s.setHasBooks)

  const { genres } = useGenres()
  const [form, setForm] = useState({ title: '', author: '', genre: '', condition: 'BUENO', description: '', coverImageUrl: '', regalo: false, trueque: true, venta: false, precio: '' })
  const [coverPreview, setCoverPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    if (!isEdit) return
    getBook(bookId)
      .then(({ data }) => {
        setForm({ title: data.title, author: data.author, genre: data.genre ?? '', condition: data.condition, description: data.description ?? '', coverImageUrl: data.coverImageUrl, regalo: data.regalo ?? false, trueque: data.trueque ?? true, venta: data.venta ?? false, precio: data.precio ?? '' })
        setCoverPreview(data.coverImageUrl)
      })
      .catch(() => { toast.error('Libro no encontrado'); navigate('/my-books') })
      .finally(() => setLoading(false))
  }, [bookId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const toggleExchange = (key) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      if (key === 'venta' && !updated.venta) updated.precio = ''
      return updated
    })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.genre) { toast.error('El género es obligatorio'); return }
    if (!form.regalo && !form.trueque && !form.venta) { toast.error('Seleccioná al menos una modalidad de trueque'); return }
    const isFirstBook = !user?.hasBooks
    setSaving(true)
    const payload = {
      ...form,
      precio: form.venta && form.precio !== '' ? parseFloat(form.precio) : null,
    }
    try {
      if (isEdit) {
        await updateBook(bookId, payload)
        toast.success('Libro actualizado')
      } else {
        const { data: bookData } = await createBook(payload)
        toast.success('Libro agregado')
        if (isFirstBook) trackFirstBookUploaded({ intent: user?.onboardingIntent ?? 'UNKNOWN', bookTitle: form.title, bookGenre: form.genre })
        updateUser({ hasBooks: true })
        setHasBooks(true)
        if (bookData.firstBook) {
          navigate('/feed', { replace: true })
          return
        }
      }
      navigate(-1)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
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

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  if (!isEdit && !user?.latitude) {
    return (
      <div className="book-form-page">
        <div className="edit-page-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Volver">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Agregar libro</h1>
        </div>
        <div className="location-required-msg">
          <span style={{ fontSize: '2rem' }}>📍</span>
          <p>Tu ubicación es necesaria para que otros usuarios cercanos puedan encontrar tu libro.</p>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Sin ubicación no podemos mostrarte en el feed de personas cercanas.</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={handleRequestLocation} disabled={locating}>
            {locating ? <Spinner size="sm" /> : '📍'}{' '}
            {locating ? 'Obteniendo ubicación...' : 'Permitir ubicación'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="book-form-page">
      <div className="edit-page-header">
        <button className="back-btn" onClick={() => navigate(-1)} aria-label="Volver">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{isEdit ? 'Editar libro' : 'Agregar libro'}</h1>
      </div>

      {!isEdit && user?.onboardingIntent === 'INTERCAMBIAR' && !user?.hasBooks && (
        <div className="book-form-motivational-banner">
          🎉 ¡Estás a un paso de comenzar a intercambiar libros!
        </div>
      )}
      {!isEdit && user?.onboardingIntent !== 'INTERCAMBIAR' && !user?.hasBooks && (
        <div className="book-form-motivational-banner">
          📚 Tu feed muestra solo libros en venta o regalo. Marcá este libro como Trueque para ver también los de trueque.
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-stack">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div className="cover-upload" onClick={() => fileRef.current?.click()} role="button" tabIndex={0}
               onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}>
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
            <Input label="Título" name="title" value={form.title} onChange={handleChange} placeholder="Título del libro" required />
            <Input label="Autor" name="author" value={form.author} onChange={handleChange} placeholder="Nombre del autor" required />
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
                <input type="radio" id={`condition-${c}`} name="condition" value={c} checked={form.condition === c} onChange={handleChange} />
                <label htmlFor={`condition-${c}`}>{c}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Descripción</label>
          <textarea className="form-textarea" name="description" value={form.description} onChange={handleChange} placeholder="¿De qué trata el libro? ¿En qué estado está?" maxLength={1000} />
        </div>

        <div className="form-field">
          <label className="form-label">Modalidad</label>
          <div className="exchange-pills">
            {[['trueque', 'Trueque'], ['regalo', 'Regalar'], ['venta', 'Vender']].map(([key, label]) => (
              <button key={key} type="button" className={`exchange-pill${form[key] ? ' active' : ''}`} onClick={() => toggleExchange(key)}>
                {label}
              </button>
            ))}
          </div>
          {form.venta && (
            <div style={{ marginTop: '0.75rem' }}>
              <Input
                label="Precio (opcional)"
                name="precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={handleChange}
                placeholder="Ej: 1500"
              />
            </div>
          )}
        </div>

        <Button type="submit" loading={saving} disabled={uploading}>
          {isEdit ? 'Guardar cambios' : 'Agregar libro'}
        </Button>
      </form>
    </div>
  )
}
