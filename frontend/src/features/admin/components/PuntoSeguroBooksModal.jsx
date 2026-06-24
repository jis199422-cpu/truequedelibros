import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  getLocalBooks, adminCreateLocalBook, adminUpdateLocalBook, adminDeleteLocalBook, uploadBookCover,
} from '../../beneficios/api/beneficios.api'
import { modalStyles as styles } from './adminModalStyles'
import { useGenres } from '../../books/hooks/useGenres'

const CONDITIONS = ['NUEVO', 'BUENO', 'USADO']

export function PuntoSeguroBooksModal({ localId, localName, onClose }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingBook, setEditingBook] = useState(undefined) // undefined = closed, null = new

  const loadBooks = () => {
    setLoading(true)
    getLocalBooks(localId).then(({ data }) => setBooks(data)).finally(() => setLoading(false))
  }

  useEffect(() => { loadBooks() }, [localId])

  const handleToggleStatus = async (book) => {
    const status = book.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
    try {
      await adminUpdateLocalBook(localId, book.id, { status })
      toast.success(status === 'AVAILABLE' ? 'Marcado como disponible' : 'Marcado como no disponible')
      loadBooks()
    } catch { toast.error('Error al actualizar el estado') }
  }

  const handleDelete = async (book) => {
    if (!window.confirm(`¿Eliminar "${book.title}"?`)) return
    try {
      await adminDeleteLocalBook(localId, book.id)
      toast.success('Libro eliminado')
      loadBooks()
    } catch { toast.error('Error al eliminar') }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Libros — {localName}</h2>

        <button style={{ ...styles.saveBtn, marginBottom: 16 }} onClick={() => setEditingBook(null)}>
          + Agregar libro
        </button>

        {loading ? <p>Cargando…</p> : (
          <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none' }}>
            {books.map(b => (
              <li key={b.id} style={bookRowStyles.row}>
                {b.coverImageUrl
                  ? <img src={b.coverImageUrl} alt={b.title} style={bookRowStyles.thumb} />
                  : <div style={{ ...bookRowStyles.thumb, ...bookRowStyles.placeholder }}>📚</div>}
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{b.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#777' }}>{b.author}</p>
                  <span style={b.status === 'AVAILABLE' ? bookRowStyles.badgeActive : bookRowStyles.badgeOff}>
                    {b.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                  <button style={styles.actionBtn} onClick={() => setEditingBook(b)}>Editar</button>
                  <button style={styles.actionBtn} onClick={() => handleToggleStatus(b)}>
                    {b.status === 'AVAILABLE' ? 'Marcar no disponible' : 'Marcar disponible'}
                  </button>
                  <button style={{ ...styles.actionBtn, color: '#dc2626' }} onClick={() => handleDelete(b)}>
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
            {books.length === 0 && <p style={{ color: '#999', fontSize: 14 }}>Todavía no hay libros en este punto seguro.</p>}
          </ul>
        )}

        <button style={styles.cancelBtn} onClick={onClose}>Cerrar</button>

        {editingBook !== undefined && (
          <PuntoSeguroBookFormModal
            localId={localId}
            book={editingBook}
            onClose={() => setEditingBook(undefined)}
            onSaved={loadBooks}
          />
        )}
      </div>
    </div>
  )
}

function PuntoSeguroBookFormModal({ localId, book, onClose, onSaved }) {
  const { genres } = useGenres()
  const [form, setForm] = useState({
    title: book?.title ?? '',
    author: book?.author ?? '',
    genre: book?.genre ?? '',
    condition: book?.condition ?? 'BUENO',
    description: book?.description ?? '',
    coverImageUrl: book?.coverImageUrl ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(book?.coverImageUrl ?? null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const imageUrl = await uploadBookCover(file)
      setForm(f => ({ ...f, coverImageUrl: imageUrl }))
    } catch {
      toast.error('Error al subir la portada')
    } finally { setUploading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (book) await adminUpdateLocalBook(localId, book.id, form)
      else await adminCreateLocalBook(localId, form)
      toast.success(book ? 'Libro actualizado' : 'Libro creado')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{book ? 'Editar libro' : 'Nuevo libro'}</h2>
        <form onSubmit={handleSave} style={styles.formStack}>
          <label style={styles.label}>
            Portada
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
              {preview
                ? <img src={preview} alt="portada" style={{ width: 60, height: 84, borderRadius: 6, objectFit: 'cover', border: '1px solid #e5e5e5' }} />
                : <div style={{ width: 60, height: 84, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#9ca3af' }}>Sin foto</div>}
              <label style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                {uploading ? 'Subiendo…' : 'Cambiar imagen'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} disabled={uploading} />
              </label>
            </div>
          </label>

          {[['Título', 'title'], ['Autor', 'author']].map(([label, key]) => (
            <label key={key} style={styles.label}>
              {label}
              <input
                style={styles.input}
                type="text"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
              />
            </label>
          ))}

          <label style={styles.label}>
            Género
            <select
              style={styles.input}
              value={form.genre}
              onChange={e => setForm(f => ({ ...f, genre: e.target.value }))}
            >
              <option value="">-- Seleccionar género --</option>
              {genres.map(g => (
                <option key={g.name} value={g.name}>{g.label}</option>
              ))}
            </select>
          </label>

          <label style={styles.label}>
            Condición
            <select
              style={styles.input}
              value={form.condition}
              onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
            >
              {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label style={styles.label}>
            Descripción (opcional)
            <textarea
              style={{ ...styles.input, minHeight: 70, fontFamily: 'inherit' }}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button style={styles.saveBtn} disabled={saving || uploading}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const bookRowStyles = {
  row: { display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
  thumb: { width: 44, height: 60, borderRadius: 6, objectFit: 'cover', flexShrink: 0 },
  placeholder: { background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 },
  badgeActive: { padding: '2px 8px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontSize: 11, fontWeight: 700 },
  badgeOff: { padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280', fontSize: 11, fontWeight: 700 },
}
