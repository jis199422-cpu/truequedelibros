import { UserAvatar } from '../../../shared/components/UserAvatar'

export function PlanLectorCard({
  plan,
  currentIndex,
  totalPlans,
  onJoin,
  onLeave,
  onNext,
  onEdit,
  onDelete,
  joining,
  leaving,
  isGuest,
}) {
  const isFull = plan.full
  const progress = Math.min((plan.currentParticipants / plan.maxParticipants) * 100, 100)

  return (
    <div className="plan-card">
      <div className="plan-card-header">
        <span className="plan-card-label">📖 Plan Lector del Día</span>
        {plan.organizer && (
          <div className="plan-card-controls">
            <button className="plan-icon-btn" onClick={onEdit} aria-label="Editar plan">✏️</button>
            <button className="plan-icon-btn" onClick={onDelete} aria-label="Eliminar plan">🗑</button>
          </div>
        )}
      </div>

      <p className="plan-card-description">"{plan.description}"</p>

      <div className="plan-card-organizer">
        <OrganizerAvatar name={plan.organizerName} avatarUrl={plan.organizerAvatarUrl} />
        <span className="plan-card-organizer-name">Organiza {plan.organizerName}</span>
      </div>

      <div className="plan-card-progress">
        <div className="plan-progress-bar">
          <div className="plan-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="plan-counter">
          {plan.currentParticipants} de {plan.maxParticipants} participantes se han unido
        </span>
      </div>

      <div className="plan-card-cta">
        {isFull && !isGuest ? (
          <p className="plan-contact-sent">
            ✉️ La información de contacto del organizador fue enviada a los participantes del evento
          </p>
        ) : isFull ? (
          null
        ) : plan.organizer ? (
          <button className="btn btn-outline" disabled>Tu plan</button>
        ) : plan.participant ? (
          <button className="btn btn-outline" onClick={onLeave} disabled={leaving}>
            {leaving ? '...' : 'Abandonar'}
          </button>
        ) : isGuest ? (
          <button className="btn btn-primary" onClick={onJoin}>
            Iniciá sesión para unirte
          </button>
        ) : (
          <button className="btn btn-primary" onClick={onJoin} disabled={joining}>
            {joining ? '...' : 'Unirme'}
          </button>
        )}
      </div>

      <div className="plan-card-footer">
        {totalPlans > 0 && (
          <span className="plan-footer-index">Plan {currentIndex + 1} de {totalPlans}</span>
        )}
        <button
          className="plan-next-btn"
          onClick={onNext}
          disabled={totalPlans <= 1}
        >
          Siguiente plan →
        </button>
      </div>
    </div>
  )
}

function OrganizerAvatar({ name, avatarUrl }) {
  return <UserAvatar name={name} url={avatarUrl} seed={name} className="avatar-sm plan-avatar" />
}
