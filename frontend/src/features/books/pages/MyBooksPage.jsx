import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../../auth/store/authStore'
import { getPublicProfile } from '../../../shared/api/users.api'
import { updateBook, deleteBook } from '../../../shared/api/books.api'
import { Spinner } from '../../../shared/components/Spinner'

export function MyBooksPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    getPublicProfile(user.id)
      .then(({ data }) => { if (!cancelled) setBooks(data.books ?? []) })
      .catch(() => { if (!cancelled) toast.error('Error al cargar tus libros') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

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

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="my-books-page">
      <div className="my-books-header">
        <h1 className="page-title" style={{ margin: 0 }}>Mis libros ({books.length})</h1>
        <button className="add-btn" onClick={() => navigate('/books/new')} aria-label="Agregar libro">
          +
        </button>
      </div>

      {books.length === 0 ? (
        <div className="placeholder-page">
          <h2>Aún no tienes libros</h2>
          <p>Agrega tu primer libro para empezar a intercambiar</p>
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
              <div className="my-book-meta">
                <span className={`book-card-condition condition-${book.condition}`}>{book.condition}</span>
                <span className={`status-chip status-${book.status}`}>
                  {book.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'}
                </span>
              </div>
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
