import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getAdminBooks, adminDeleteBook } from '../../../shared/api/admin.api'
import { Spinner } from '../../../shared/components/Spinner'

export function AdminBooksPage() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    getAdminBooks()
      .then(({ data }) => setBooks(data))
      .catch(() => toast.error('Error al cargar libros'))
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (book) => {
    if (!confirm(`¿Eliminar "${book.title}" de ${book.owner.name}?`)) return
    setDeleting(book.id)
    try {
      await adminDeleteBook(book.id)
      setBooks((prev) => prev.filter((b) => b.id !== book.id))
      toast.success('Libro eliminado')
    } catch {
      toast.error('Error al eliminar el libro')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase()) ||
    b.owner.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Libros ({books.length})</h1>
        <input
          className="admin-search"
          placeholder="Buscar por título, autor o dueño…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Portada</th>
              <th>Título</th>
              <th>Autor</th>
              <th>Condición</th>
              <th>Estado</th>
              <th>Dueño</th>
              <th>Publicado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((book) => (
              <tr key={book.id}>
                <td>
                  {book.coverImageUrl
                    ? <img className="admin-book-thumb" src={book.coverImageUrl} alt={book.title} />
                    : <div className="admin-book-thumb admin-book-thumb--placeholder">📚</div>}
                </td>
                <td className="admin-cell-name">{book.title}</td>
                <td className="admin-cell-muted">{book.author}</td>
                <td>
                  <span className={`book-card-condition condition-${book.condition}`}>{book.condition}</span>
                </td>
                <td>
                  <span className={`status-chip status-${book.status}`}>
                    {book.status === 'AVAILABLE' ? 'Disponible' : 'No disponible'}
                  </span>
                </td>
                <td>
                  <div className="admin-cell-owner">
                    <span className="admin-cell-name">{book.owner.name}</span>
                    <span className="admin-cell-muted">{book.owner.email}</span>
                  </div>
                </td>
                <td className="admin-cell-muted">{formatDate(book.createdAt)}</td>
                <td>
                  <button
                    className="btn btn-sm admin-ban-btn"
                    disabled={deleting === book.id}
                    onClick={() => handleDelete(book)}
                  >
                    {deleting === book.id ? <Spinner size="sm" /> : 'Eliminar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="admin-empty">No se encontraron libros</p>
        )}
      </div>
    </div>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })
}
