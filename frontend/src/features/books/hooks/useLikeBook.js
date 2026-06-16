import { useState } from 'react'
import toast from 'react-hot-toast'
import { likeBook } from '../../../shared/api/books.api'
import useAuthStore from '../../auth/store/authStore'
import useLikeGateStore from '../../feed/store/likeGateStore'

export function useLikeBook() {
  const currentUser = useAuthStore((s) => s.user)
  const { dailyCount, dailyLimit, isPremium, hasBooks, warningShown, incrementCount, markWarningShown } = useLikeGateStore()
  const [match, setMatch] = useState(null)
  const [liking, setLiking] = useState(false)
  const [gateModal, setGateModal] = useState(null)

  const handleLike = async (book) => {
    if (liking) return

    const userId = currentUser?.id
    const premium = currentUser?.premium ?? isPremium

    // Hard block if daily limit already reached (only for users without books)
    if (userId && !premium && !hasBooks && dailyCount >= dailyLimit) {
      setGateModal('blocking')
      return
    }

    setLiking(true)
    try {
      const { data } = await likeBook(book.id)
      if (data.matched) {
        setMatch({ book, conversationId: data.conversationId })
      }

      if (userId && !premium) {
        incrementCount()
        const newCount = dailyCount + 1
        const warningThreshold = Math.floor(dailyLimit / 2)

        if (newCount >= warningThreshold && !warningShown[userId] && !hasBooks) {
          setGateModal('warning')
        }

        if (newCount >= dailyLimit && !hasBooks) {
          setGateModal('blocking')
        }
      }
    } catch (err) {
      const status = err.response?.status
      const msg = err.response?.data?.error

      if (status === 429) {
        if (userId && !hasBooks) {
          setGateModal('blocking')
        }
      } else if (msg === 'Ya diste like a este libro') {
        toast('Ya le habías dado like a este libro', { icon: 'ℹ️' })
      } else {
        toast.error('Error al dar like')
      }
    } finally {
      setLiking(false)
    }
  }

  const clearMatch = () => setMatch(null)
  const clearGateModal = () => setGateModal(null)
  const markWarning = () => { if (currentUser?.id) markWarningShown(currentUser.id) }

  return { handleLike, match, clearMatch, liking, gateModal, clearGateModal, markWarning }
}
