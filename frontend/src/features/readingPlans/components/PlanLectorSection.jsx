import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReadingPlans } from '../hooks/useReadingPlans'
import { PlanesDelDiaModal } from './PlanesDelDiaModal'
import { CreatePlanModal } from './CreatePlanModal'
import { EditPlanModal } from './EditPlanModal'

export function PlanLectorSection({ isGuest }) {
  const [modalOpen, setModalOpen] = useState(false)
  const navigate = useNavigate()

  const {
    plans,
    currentPlan,
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
  } = useReadingPlans()

  const userHasActivePlan = plans.some((p) => p.organizer)

  const handleJoinOrPrompt = (planId) => {
    if (isGuest) { navigate('/login'); return }
    handleJoin(planId)
  }

  return (
    <div className="plan-section">
      <button className="plan-toggle" onClick={() => setModalOpen(true)}>
        <span className="plan-toggle-label">📖 Planes del día</span>
        <span className="plan-toggle-chevron">›</span>
      </button>

      {modalOpen && (
        <PlanesDelDiaModal
          plans={plans}
          currentPlan={currentPlan}
          planIndex={planIndex}
          plansLoading={plansLoading}
          joiningId={joiningId}
          leavingId={leavingId}
          userHasActivePlan={userHasActivePlan}
          isGuest={isGuest}
          onClose={() => setModalOpen(false)}
          onJoin={handleJoinOrPrompt}
          onLeave={handleLeave}
          onNext={handleNext}
          onEdit={setEditingPlan}
          onDelete={handleDelete}
          onPublish={() => setShowCreateModal(true)}
        />
      )}

      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreate}
        />
      )}

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => setEditingPlan(null)}
          onSuccess={handleUpdate}
        />
      )}
    </div>
  )
}
