import { useState } from 'react'
import { createReadingPlan } from '../api/readingPlans.api'

export function CreatePlanModal({ onClose, onSuccess }) {
  const [description, setDescription] = useState('')
  const [maxParticipants, setMaxParticipants] = useState(3)
  const [contactPhone, setContactPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim() || !contactPhone.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await createReadingPlan({ description, maxParticipants, contactPhone })
      onSuccess(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="plan-modal-header">
          <h3 className="plan-modal-title">Crear plan de lectura</h3>
          <button className="plan-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {error && <p className="alert alert-error">{error}</p>}

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="form-field">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-textarea"
              placeholder="Ej: Tarde de lectura en el parque San Martín y mates"
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
              placeholder="Ej: +54 9 11 1234-5678"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              maxLength={20}
              required
            />
            <span className="form-hint">Solo se revela a los participantes cuando se completa el cuórum</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Publicando...' : 'Publicar plan'}
          </button>
        </form>
      </div>
    </div>
  )
}
