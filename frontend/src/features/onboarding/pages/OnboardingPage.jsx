import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { saveOnboarding } from '../../../shared/api/users.api'
import useAuthStore from '../../auth/store/authStore'
import { Logo } from '../../../shared/components/Logo'
import { Spinner } from '../../../shared/components/Spinner'
import { OnboardingBookStep } from '../components/OnboardingBookStep'
import { OnboardingWishlistStep } from '../components/OnboardingWishlistStep'

const FEED_FILTER_NOTE = ' Vas a ver libros en venta o regalo; los de trueque se habilitan cuando subís el tuyo.'

const OPTIONS = [
  { intent: 'INTERCAMBIAR', emoji: '🔄', title: 'Intercambiar libros', subtitle: 'Para intercambiar primero necesitamos saber qué libros tenés disponibles.' },
  { intent: 'VENDER', emoji: '💰', title: 'Vender libros', subtitle: `Publicá tu primer libro y empezá a recibir interés de otros lectores.${FEED_FILTER_NOTE}` },
  { intent: 'COMPRAR', emoji: '🛒', title: 'Comprar libros', subtitle: `Explorá el catálogo y encontrá tu próxima lectura.${FEED_FILTER_NOTE}` },
  { intent: 'OTRO', emoji: '✨', title: 'Otro', subtitle: `Contanos qué querés hacer.${FEED_FILTER_NOTE}` },
]

function ProgressDots({ current, total }) {
  return (
    <div className="onboarding-progress">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`onboarding-progress-dot${i + 1 <= current ? ' onboarding-progress-dot--active' : ''}`} />
      ))}
    </div>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const [step, setStep] = useState(1)
  const [intent, setIntent] = useState(null)
  const [selected, setSelected] = useState(null)
  const [customText, setCustomText] = useState('')
  const [loading, setLoading] = useState(false)

  if (user?.onboardingCompleted) return <Navigate to="/feed" replace />

  const needsBookStep = intent === 'INTERCAMBIAR' || intent === 'VENDER'
  const totalSteps = needsBookStep ? 3 : 2
  const goToFeed = () => {
    updateUser({ onboardingCompleted: true })
    navigate('/feed', { replace: true })
  }

  const submit = async (chosenIntent, customIntent) => {
    setLoading(true)
    try {
      await saveOnboarding(chosenIntent, customIntent)
      // onboardingCompleted se setea recién en goToFeed() para evitar que el
      // guard de arriba redirija al feed antes de mostrar el paso 2
      updateUser({ onboardingIntent: chosenIntent, hasBooks: false })
      setIntent(chosenIntent)
      setStep(2)
    } catch {
      toast.error('No pudimos guardar tu selección. Intentá de nuevo.')
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (opt) => {
    if (loading) return
    setSelected(opt)
    setCustomText('')
    if (opt !== 'OTRO') submit(opt, null)
  }

  const handleOtroSubmit = (e) => {
    e.preventDefault()
    if (!customText.trim()) return
    submit('OTRO', customText.trim())
  }

  // Step 2 for INTERCAMBIAR/VENDER: book upload
  if (step === 2 && needsBookStep) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-header">
          <Logo />
          <ProgressDots current={2} total={3} />
          <h1 className="onboarding-title">Agregá tu primer libro</h1>
          <p className="onboarding-subtitle">
            Para {intent === 'INTERCAMBIAR' ? 'hacer trueques' : 'vender'} necesitás al menos un libro.
          </p>
        </div>
        <OnboardingBookStep intent={intent} onDone={() => setStep(3)} />
      </div>
    )
  }

  // Step 3 (INTERCAMBIAR/VENDER) or Step 2 (COMPRAR/OTRO): wishlist
  if (step >= 2) {
    return (
      <div className="onboarding-page">
        <div className="onboarding-header">
          <Logo />
          <ProgressDots current={step} total={totalSteps} />
          <h1 className="onboarding-title">¿Qué libros estás buscando?</h1>
          <p className="onboarding-subtitle">Te avisamos cuando alguien tenga lo que buscás.</p>
        </div>
        <OnboardingWishlistStep onDone={goToFeed} />
      </div>
    )
  }

  // Step 1: intent selection
  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <Logo />
        <h1 className="onboarding-title">¿Qué te gustaría hacer en Trueque de Libros?</h1>
        <p className="onboarding-subtitle">Elegí una opción para empezar</p>
      </div>
      <div className="onboarding-options">
        {OPTIONS.map(({ intent: opt, emoji, title, subtitle }) => (
          <div key={opt}>
            <button
              className={`onboarding-option-card${selected === opt ? ' onboarding-option-card--selected' : ''}`}
              onClick={() => handleSelect(opt)}
              disabled={loading}
            >
              <span className="onboarding-option-emoji">{emoji}</span>
              <span className="onboarding-option-title">{title}</span>
              <span className="onboarding-option-subtitle">{subtitle}</span>
            </button>
            {selected === opt && opt === 'OTRO' && (
              <form className="onboarding-otro-form" onSubmit={handleOtroSubmit}>
                <textarea
                  className="onboarding-otro-input"
                  placeholder="Ej: Quiero encontrar mangas, coleccionar libros de cocina..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  rows={3}
                  maxLength={400}
                  autoFocus
                  disabled={loading}
                />
                <button type="submit" className="btn btn-primary" disabled={!customText.trim() || loading}>
                  {loading ? <Spinner size="sm" /> : 'Continuar'}
                </button>
              </form>
            )}
          </div>
        ))}
      </div>
      {loading && selected !== 'OTRO' && <div className="onboarding-loading"><Spinner size="lg" /></div>}
    </div>
  )
}
