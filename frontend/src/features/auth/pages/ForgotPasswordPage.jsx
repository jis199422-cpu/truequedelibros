import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '../components/AuthLayout'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { Logo } from '../../../shared/components/Logo'
import { forgotPassword } from '../../../shared/api/auth.api'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await forgotPassword({ email })
      setSent(true)
    } catch {
      toast.error('Error al procesar la solicitud. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="auth-header">
          <Logo />
          <h2 style={{ textAlign: 'center', marginTop: '1rem' }}>Revisa tu correo</h2>
          <p className="auth-subtitle">
            Si el email está registrado, recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>
        <p className="auth-footer">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="auth-header">
        <Logo />
        <p className="auth-subtitle">Ingresa tu email para restablecer tu contraseña</p>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <Input
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          autoComplete="email"
        />
        <Button type="submit" loading={loading}>
          Enviar enlace
        </Button>
      </form>

      <p className="auth-footer">
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </AuthLayout>
  )
}
