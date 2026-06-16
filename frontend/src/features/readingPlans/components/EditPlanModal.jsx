import { useState } from 'react'
import { updateReadingPlan } from '../api/readingPlans.api'

export function EditPlanModal({ plan, onClose, onSuccess }) {
  const [description, setDescription] = useState(plan.description)
  const [maxParticipants, setMaxParticipants] = useState(plan.maxParticipants)
  const [contactPhone, setContactPhone] = useState(plan.contactPhone ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim() || !contactPhone.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await updateReadingPlan(plan.id, { description, maxParticipants, contactPhone })
      onSuccess(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modal-header">
          <h3 className="plan-modal-title">Editar plan</h3>
          <button className="plan-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {error && <p className="alert alert-error">{error}</p>}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-field">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              required
              rows={3}
            />
            <span className="plan-char-count">{description.length}/300</span>
          </div>

          <div className="form-field">
            <label className="form-label">Mínimo de participantes</label>
            <input
              type="number"
              className="form-input"
              min={3}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Math.max(3, Number(e.target.value)))}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Teléfono de contacto</label>
            <input
              type="tel"
              className="form-input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              maxLength={20}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
