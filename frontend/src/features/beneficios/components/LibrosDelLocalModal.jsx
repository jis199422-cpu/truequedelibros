import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getLocalPublicBooks, reportBookUnavailable } from '../api/beneficios.api'
import { Spinner } from '../../../shared/components/Spinner'

export function LibrosDelLocalModal({ local, onClose }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [reported, setReported] = useState(new Set())
  const [reporting, setReporting] = useState(null)
  const [reportingBook, setReportingBook] = useState(null)
  const [reportMessage, setReportMessage] = useState('')

  useEffect(() => {
    getLocalPublicBooks(local.id)
      .then(({ data }) => setBooks(data))
      .catch(() => toast.error('Error al cargar los libros'))
      .finally(() => setLoading(false))
  }, [local.id])

  const handleReport = async (bookId, message) => {
    setReporting(bookId)
    try {
      await reportBookUnavailable(local.id, bookId, message)
      setReported(prev => new Set(prev).add(bookId))
      setReportingBook(null)
      setReportMessage('')
      toast.success('Reporte enviado. ¡Gracias!')
    } catch {
      toast.error('Error al enviar el reporte. Intentá de nuevo.')
    } finally {
      setReporting(null)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose} aria-label="Cerrar">✕</button>

        <h2 style={styles.title}>📚 Libros en {local.name}</h2>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            <strong>¿Cómo funciona?</strong>
          </p>
          <ul style={styles.infoList}>
            <li>Podés leer estos libros <strong>de forma gratuita</strong> en el local.</li>
            <li>
              Si querés llevarte un libro a casa, <strong>es obligatorio dejar otro libro a cambio en el momento</strong>.
              Tenés <strong>30 días para devolverlo</strong> (o <strong>60 días con cuenta premium</strong> —{' '}
              escribí a{' '}
              <a href="mailto:contacto@truequedelibros.com" style={styles.mailLink}>
                contacto@truequedelibros.com
              </a>{' '}
              para habilitarla).
            </li>
            <li>Una vez devuelto o terminado de leer, podés buscar otro libro, o buscar el que habías dejado.</li>
            <li style={styles.warningItem}>
              🚫 <strong>Está prohibido vender los libros.</strong>
            </li>
            <li>
              Si te llevás o dejás un libro, escribí a{' '}
              <a href="mailto:contacto@truequedelibros.com" style={styles.mailLink}>
                contacto@truequedelibros.com
              </a>{' '}
              con una foto del libro que te llevaste y una foto del libro que dejaste.
            </li>
          </ul>
        </div>

        <div style={styles.bookList}>
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner size="md" /></div>}

          {!loading && books.length === 0 && (
            <p style={styles.emptyMsg}>Este local todavía no tiene libros cargados.</p>
          )}

          {!loading && books.map(book => (
            <div key={book.id} style={styles.bookItem}>
              {book.coverImageUrl && (
                <img src={book.coverImageUrl} alt={book.title} style={styles.cover} />
              )}
              <div style={styles.bookInfo}>
                <p style={styles.bookTitle}>{book.title}</p>
                <p style={styles.bookAuthor}>{book.author}</p>
              </div>
              {reported.has(book.id) ? (
                <span style={styles.reportedBadge}>✓ Reportado</span>
              ) : (
                <button
                  style={styles.reportBtn}
                  onClick={() => setReportingBook(book)}
                  disabled={reporting === book.id}
                >
                  Reportar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {reportingBook && (
        <div style={styles.miniOverlay} onClick={() => { setReportingBook(null); setReportMessage('') }}>
          <div style={styles.miniModal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.miniTitle}>Reportar libro no disponible</h3>
            <p style={styles.miniSubtitle}>{reportingBook.title}</p>
            <textarea
              style={styles.textarea}
              placeholder="¿Querés agregar algún comentario? (opcional)"
              value={reportMessage}
              onChange={e => setReportMessage(e.target.value)}
              rows={3}
            />
            <div style={styles.miniActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => { setReportingBook(null); setReportMessage('') }}
              >
                Cancelar
              </button>
              <button
                style={styles.confirmBtn}
                onClick={() => handleReport(reportingBook.id, reportMessage)}
                disabled={reporting === reportingBook.id}
              >
                {reporting === reportingBook.id ? <Spinner size="sm" /> : 'Reportar libro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  modal: {
    background: '#fff', borderRadius: '16px 16px 0 0',
    width: '100%', maxWidth: 640,
    maxHeight: '90vh', overflowY: 'auto',
    padding: '24px 20px 48px',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    background: 'none', border: 'none', fontSize: 20,
    cursor: 'pointer', color: '#888', lineHeight: 1,
  },
  title: { margin: '0 0 16px', fontSize: 20, fontWeight: 800, paddingRight: 32 },
  infoBox: {
    background: '#f0f7f4', borderRadius: 10,
    padding: '14px 16px', marginBottom: 20,
  },
  infoText: { margin: '0 0 8px', fontSize: 14, color: '#1a1a1a' },
  infoList: {
    margin: '0 0 10px', paddingLeft: 18,
    listStyle: 'disc', fontSize: 14, color: '#444', lineHeight: 1.7,
  },
  warningItem: { color: '#c0392b', fontWeight: 500 },
  mailLink: { color: '#5b8fa8', fontWeight: 600 },
  bookList: { display: 'flex', flexDirection: 'column', gap: 12 },
  emptyMsg: { textAlign: 'center', color: '#888', padding: '1.5rem 0', fontSize: 14 },
  bookItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    background: '#fafafa', borderRadius: 10,
    padding: '10px 12px', border: '1px solid #eee',
  },
  cover: { width: 44, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 },
  bookInfo: { flex: 1, minWidth: 0 },
  bookTitle: { margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  bookAuthor: { margin: 0, fontSize: 12, color: '#666' },
  reportBtn: {
    flexShrink: 0, fontSize: 11, fontWeight: 600,
    padding: '6px 10px', borderRadius: 8,
    border: '1px solid #e0a0a0', background: '#fff5f5',
    color: '#c0392b', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  reportedBadge: {
    flexShrink: 0, fontSize: 11, fontWeight: 600,
    padding: '6px 10px', borderRadius: 8,
    background: '#f0f7f4', color: '#27ae60',
    whiteSpace: 'nowrap',
  },
  miniOverlay: {
    position: 'fixed', inset: 0, zIndex: 1100,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 16px',
  },
  miniModal: {
    background: '#fff', borderRadius: 14,
    padding: '24px 20px', width: '100%', maxWidth: 420,
  },
  miniTitle: { margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1a1a1a' },
  miniSubtitle: { margin: '0 0 14px', fontSize: 13, color: '#666' },
  textarea: {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 8,
    border: '1px solid #ddd', fontSize: 14, color: '#1a1a1a',
    resize: 'vertical', fontFamily: 'inherit', outline: 'none',
  },
  miniActions: {
    display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14,
  },
  cancelBtn: {
    padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
    border: '1px solid #ddd', background: '#f5f5f5', color: '#555', cursor: 'pointer',
  },
  confirmBtn: {
    padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600,
    border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer',
    minWidth: 110, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
}
