import { useState } from 'react'
import { saveUserInterests } from '../../../shared/api/users.api'
import toast from 'react-hot-toast'

const INTERESTS = [
  { key: 'INTERCAMBIAR_LIBROS_USADOS', label: 'Intercambiar libros usados',      emoji: '🔄' },
  { key: 'VENDER_LIBROS',              label: 'Vender libros',                   emoji: '💰' },
  { key: 'REGALAR_LIBROS',             label: 'Regalar libros',                  emoji: '🎁' },
  { key: 'PARTICIPAR_EVENTOS_LECTURA', label: 'Participar de eventos de lectura', emoji: '📚' },
  { key: 'CONOCER_NUEVAS_PERSONAS',    label: 'Conocer nuevas personas',         emoji: '👥' },
  { key: 'COMPRAR_LIBROS',             label: 'Comprar libros',                  emoji: '🛒' },
  { key: 'DESCUENTOS_EN_LOCALES',      label: 'Descuentos en locales',           emoji: '🏷️' },
  { key: 'OTRO',                       label: 'Otro',                            emoji: '✏️' },
]

export function InterestsModal({ onDone }) {
  const [selected, setSelected] = useState(new Set())
  const [otroText, setOtroText] = useState('')
  const [touched, setTouched] = useState(false)
  const [otroError, setOtroError] = useState(false)
  const [loading, setLoading] = useState(false)

  const toggle = (key) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        if (key === 'OTRO') setOtroText('')
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    setTouched(true)
    if (selected.size === 0) return
    if (selected.has('OTRO') && !otroText.trim()) {
      setOtroError(true)
      return
    }
    setLoading(true)
    try {
      const payload = [...selected].map((key) => ({
        interest: key,
        ...(key === 'OTRO' && otroText.trim() ? { customText: otroText.trim() } : {}),
      }))
      await saveUserInterests(payload)
      onDone()
    } catch {
      toast.error('No pudimos guardar tus intereses. Intentá de nuevo.')
      setLoading(false)
    }
  }

  const hasError = touched && selected.size === 0

  return (
    <div className="modal-overlay">
      <div className="interests-modal" onClick={(e) => e.stopPropagation()}>
        <div className="interests-modal-header">
          <span className="interests-modal-icon">📖</span>
          <h2 className="interests-modal-title">¿Qué te trae por aquí?</h2>
          <p className="interests-modal-sub">
            Seleccioná todo lo que te interesa. Podés elegir más de uno.
          </p>
        </div>

        <div className="interests-chips-grid">
          {INTERESTS.map(({ key, label, emoji }) => (
            <button
              key={key}
              type="button"
              className={`interest-chip${selected.has(key) ? ' interest-chip--selected' : ''}`}
              onClick={() => toggle(key)}
              aria-pressed={selected.has(key)}
            >
              <span className="interest-chip-emoji">{emoji}</span>
              <span className="interest-chip-label">{label}</span>
            </button>
          ))}
        </div>

        {selected.has('OTRO') && (
          <div className="interests-otro-wrapper">
            <textarea
              className="interests-otro-input"
              placeholder="Contanos más sobre lo que buscás..."
              value={otroText}
              onChange={(e) => { setOtroText(e.target.value); setOtroError(false) }}
              maxLength={255}
            />
            {otroError && (
              <p className="interests-error">Por favor completá el campo &quot;Otro&quot;.</p>
            )}
          </div>
        )}

        {hasError && (
          <p className="interests-error">Seleccioná al menos una opción para continuar.</p>
        )}

        <button
          className="btn btn-primary interests-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Guardando…' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
