import { useEffect, useState } from 'react'
import { getGenres } from '../../../shared/api/genres.api'

export function useGenres() {
  const [genres, setGenres] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGenres()
      .then(({ data }) => setGenres(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return { genres, loading }
}
