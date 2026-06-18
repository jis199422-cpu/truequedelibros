import { useEffect, useRef, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { Logo } from '../../../shared/components/Logo'
import { Spinner } from '../../../shared/components/Spinner'
import { verifyEmail } from '../../../shared/api/auth.api'
import { trackRegistrationCompleted } from '../../../shared/utils/metaPixel'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const token = params.get('token')
    if (!token) {
      setMessage('Enlace de verificación inválido.')
      setStatus('error')
      return
    }

    verifyEmail(token)
      .then(({ data }) => {
        setMessage(data.message)
        setStatus('success')
        const source = localStorage.getItem('pendingRegistrationSource') ?? 'direct'
        localStorage.removeItem('pendingRegistrationSource')
        trackRegistrationCompleted({ authMethod: 'email', source })
      })
      .catch((err) => {
        setMessage(err.response?.data?.error || 'El enlace es inválido o ha expirado.')
        setStatus('error')
      })
  }, [])

  return (
    <AuthLayout>
      <div className="auth-header">
        <Logo />
        <h2 className="auth-title">Verificación de cuenta</h2>
      </div>

      {status === 'loading' && (
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <Spinner size="lg" />
          <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Verificando tu cuenta...
          </p>
        </div>
      )}

      {status === 'success' && <div className="alert alert-success">{message}</div>}
      {status === 'error' && <div className="alert alert-error">{message}</div>}

      {status !== 'loading' && (
        <p className="auth-footer">
          <Link to="/login">Ir al inicio de sesión</Link>
        </p>
      )}
    </AuthLayout>
  )
}
