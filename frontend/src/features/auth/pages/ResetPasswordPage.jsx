import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '../components/AuthLayout'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { Logo } from '../../../shared/components/Logo'
import { resetPassword } from '../../../shared/api/auth.api'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <AuthLayout>
        <div className="auth-header">
          <Logo />
          <p className="auth-subtitle">
            Enlace inválido. Solicita un nuevo enlace de restablecimiento.
          </p>
        </div>
        <p className="auth-footer">
          <Link to="/forgot-password">Solicitar nuevo enlace</Link>
        </p>
      </AuthLayout>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading(true)
    try {
      await resetPassword({ token, newPassword: password })
      toast.success('Contraseña restablecida exitosamente')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.error
      toast.error(msg || 'El enlace es inválido o ya expiró')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-header">
        <Logo />
        <p className="auth-subtitle">Crea una nueva contraseña</p>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <Input
          label="Nueva contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading}>
          Restablecer contraseña
        </Button>
      </form>

      <p className="auth-footer">
        <Link to="/login">Volver al inicio de sesión</Link>
      </p>
    </AuthLayout>
  )
}
