import { useEffect, useState } from 'react'
import useAuthStore from '../../auth/store/authStore'
import { getPublicProfile } from '../../../shared/api/users.api'

export function useHasAvailableBooks() {
  const user = useAuthStore((s) => s.user)
  const [hasAvailableBooks, setHasAvailableBooks] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    getPublicProfile(user.id)
      .then(({ data }) => {
        if (cancelled) return
        const books = data.books ?? []
        setHasAvailableBooks(books.some((b) => b.status === 'AVAILABLE'))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.id])

  return { hasAvailableBooks }
}
