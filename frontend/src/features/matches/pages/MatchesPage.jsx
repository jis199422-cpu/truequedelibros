import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getMatches } from '../../../shared/api/matches.api'
import { Spinner } from '../../../shared/components/Spinner'

export function MatchesPage() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getMatches()
      .then(({ data }) => { if (!cancelled) setMatches(data) })
      .catch(() => { if (!cancelled) toast.error('Error al cargar los trueques') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="spinner-page"><Spinner size="lg" /></div>

  return (
    <div className="matches-page">
      <h1 className="page-title">Trueques ({matches.length})</h1>

      {matches.length === 0 ? (
        <div className="placeholder-page">
          <h2>Aún no tienes trueques</h2>
          <p>Cuando hagas match con alguien aparecerá aquí</p>
        </div>
      ) : (
        matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onClick={() => navigate(`/chat/${match.conversationId}`)}
          />
        ))
      )}
    </div>
  )
}

function MatchCard({ match, onClick }) {
  const { otherUser, bookYouLiked, bookTheyLiked, createdAt } = match

  return (
    <div className="match-card" onClick={onClick} role="button" tabIndex={0}
         onKeyDown={(e) => e.key === 'Enter' && onClick()}>
      <div className="match-books">
        <BookThumb book={bookTheyLiked} />
        <span className="match-swap-icon">⇄</span>
        <BookThumb book={bookYouLiked} />
      </div>

      <div className="match-info">
        <p className="match-name">{otherUser.name}</p>
        <p className="match-subtitle">
          Tú quieres «{bookYouLiked.title}» · Ellos quieren «{bookTheyLiked.title}»
        </p>
      </div>

      <span className="match-date">{formatDate(createdAt)}</span>
    </div>
  )
}

function BookThumb({ book }) {
  return book?.coverImageUrl
    ? <img className="match-book-thumb" src={book.coverImageUrl} alt={book.title} />
    : <div className="match-book-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📚</div>
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
