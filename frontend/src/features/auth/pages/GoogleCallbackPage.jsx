import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import { getCurrentUser } from '../../../shared/api/auth.api'
import { trackRegistrationCompleted } from '../../../shared/utils/metaPixel'

export function GoogleCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth, setAccessToken } = useAuthStore()

  useEffect(() => {
    let cancelled = false
    const accessToken = params.get('accessToken')
    const isNewUser = params.get('isNewUser') === 'true'

    if (!accessToken) {
      toast.error('Error al iniciar sesión con Google')
      navigate('/login', { replace: true })
      return
    }

    setAccessToken(accessToken)

    getCurrentUser()
      .then(({ data }) => {
        if (cancelled) return
        setAuth(accessToken, data)
        if (isNewUser) trackRegistrationCompleted({ authMethod: 'google', source: 'direct' })
        navigate(data.onboardingCompleted ? '/feed' : '/onboarding', { replace: true })
      })
      .catch(() => {
        if (cancelled) return
        toast.error('No se pudo obtener el perfil. Intenta de nuevo.')
        navigate('/login', { replace: true })
      })

    return () => { cancelled = true }
  }, [])

  return (
    <div className="spinner-page">
      <span className="spinner spinner-lg" />
    </div>
  )
}
