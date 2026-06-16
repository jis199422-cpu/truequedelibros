import { Spinner } from '../../../shared/components/Spinner'
import { PlanLectorCard } from './PlanLectorCard'

export function PlanesDelDiaModal({
  plans,
  currentPlan,
  planIndex,
  plansLoading,
  joiningId,
  leavingId,
  userHasActivePlan,
  isGuest,
  onClose,
  onJoin,
  onLeave,
  onNext,
  onEdit,
  onDelete,
  onPublish,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modal-header">
          <h2 className="plan-modal-title">📖 Planes del día</h2>
          <button className="plan-modal-close" onClick={onClose}>✕</button>
        </div>

        {plansLoading ? (
          <div className="plan-section-loading">
            <Spinner size="sm" />
          </div>
        ) : currentPlan ? (
          <PlanLectorCard
            plan={currentPlan}
            currentIndex={planIndex}
            totalPlans={plans.length}
            onJoin={() => onJoin(currentPlan.id)}
            onLeave={() => onLeave(currentPlan.id)}
            onNext={onNext}
            onEdit={() => onEdit(currentPlan)}
            onDelete={() => onDelete(currentPlan.id)}
            joining={joiningId === currentPlan.id}
            leaving={leavingId === currentPlan.id}
            isGuest={isGuest}
          />
        ) : (
          <div className="plan-empty-state">
            <p>No hay planes activos.{!isGuest && ' ¡Sé el primero en publicar uno!'}</p>
          </div>
        )}

        {!isGuest && !userHasActivePlan && (
          <button
            className="btn btn-primary plan-publish-btn"
            onClick={onPublish}
          >
            + Publicar plan de lectura
          </button>
        )}
      </div>
    </div>
  )
}
