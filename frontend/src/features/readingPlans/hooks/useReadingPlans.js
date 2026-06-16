import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  getReadingPlans,
  joinReadingPlan,
  leaveReadingPlan,
  deleteReadingPlan,
} from '../api/readingPlans.api'

export function useReadingPlans() {
  const [plans, setPlans] = useState([])
  const [planIndex, setPlanIndex] = useState(0)
  const [planPage, setPlanPage] = useState(0)
  const [hasMorePlans, setHasMorePlans] = useState(true)
  const [plansLoading, setPlansLoading] = useState(true)
  const [joiningId, setJoiningId] = useState(null)
  const [leavingId, setLeavingId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const loadPlans = useCallback(async (page, reset = false) => {
    try {
      const { data } = await getReadingPlans(page)
      setPlans((prev) => (reset ? data.plans : [...prev, ...data.plans]))
      setHasMorePlans(data.hasMore)
      setPlanPage(page)
    } catch {
      // silent — plans are non-critical
    } finally {
      setPlansLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlans(0, true)
  }, [loadPlans])

  const handleNext = useCallback(async () => {
    const nextIndex = planIndex + 1
    if (nextIndex < plans.length) {
      setPlanIndex(nextIndex)
    } else if (hasMorePlans) {
      try {
        const { data } = await getReadingPlans(planPage + 1)
        setPlans((prev) => [...prev, ...data.plans])
        setHasMorePlans(data.hasMore)
        setPlanPage(planPage + 1)
        setPlanIndex(nextIndex)
      } catch {}
    } else if (plans.length > 1) {
      setPlanIndex(0)
    }
  }, [planIndex, plans.length, hasMorePlans, planPage])

  const handleJoin = useCallback(async (planId) => {
    setJoiningId(planId)
    try {
      const { data } = await joinReadingPlan(planId)
      setPlans((prev) => prev.map((p) => (p.id === planId ? data : p)))
      toast.success('¡Te uniste al plan!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al unirse al plan')
    } finally {
      setJoiningId(null)
    }
  }, [])

  const handleLeave = useCallback(async (planId) => {
    setLeavingId(planId)
    try {
      const { data } = await leaveReadingPlan(planId)
      setPlans((prev) => prev.map((p) => (p.id === planId ? data : p)))
      toast.success('Abandonaste el plan')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al abandonar el plan')
    } finally {
      setLeavingId(null)
    }
  }, [])

  const handleCreate = useCallback((newPlan) => {
    setPlans((prev) => [newPlan, ...prev])
    setPlanIndex(0)
    setShowCreateModal(false)
  }, [])

  const handleUpdate = useCallback((updatedPlan) => {
    setPlans((prev) => prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)))
    setEditingPlan(null)
  }, [])

  const handleDelete = useCallback(
    async (planId) => {
      try {
        await deleteReadingPlan(planId)
        setPlans((prev) => {
          const next = prev.filter((p) => p.id !== planId)
          if (planIndex >= next.length && next.length > 0) setPlanIndex(next.length - 1)
          else if (next.length === 0) setPlanIndex(0)
          return next
        })
        toast.success('Plan eliminado')
      } catch {
        toast.error('Error al eliminar el plan')
      }
    },
    [planIndex]
  )

  return {
    plans,
    currentPlan: plans[planIndex] ?? null,
    planIndex,
    plansLoading,
    joiningId,
    leavingId,
    showCreateModal,
    setShowCreateModal,
    editingPlan,
    setEditingPlan,
    handleNext,
    handleJoin,
    handleLeave,
    handleCreate,
    handleUpdate,
    handleDelete,
  }
}
