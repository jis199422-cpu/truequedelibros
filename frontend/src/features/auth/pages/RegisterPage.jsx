import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '../components/AuthLayout'
import { GoogleLoginButton } from '../components/GoogleLoginButton'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { Logo } from '../../../shared/components/Logo'
import { register } from '../../../shared/api/auth.api'
import { trackRegistrationStarted } from '../../../shared/utils/metaPixel'

export function RegisterPage() {
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const startedTracked = useRef(false)

  useEffect(() => {
    if (startedTracked.current) return
    startedTracked.current = true
    trackRegistrationStarted(location.state?.source ?? 'direct')
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      localStorage.setItem('pendingRegistrationSource', location.state?.source ?? 'direct')
      setSent(true)
    } catch (err) {
      const res = err.response?.data
      if (res?.fields) setErrors(res.fields)
      else toast.error(res?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="auth-header">
          <Logo />
          <h2 className="auth-title">¡Revisa tu correo!</h2>
          <p className="auth-subtitle">
            Enviamos un enlace de verificación a <strong>{form.email}</strong>
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
        <p className="auth-subtitle">Crea tu cuenta y empieza a intercambiar</p>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
        <Input
          label="Nombre"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Tu nombre"
          autoComplete="name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="tu@email.com"
          autoComplete="email"
        />
        <Input
          label="Contraseña"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading}>
          Crear cuenta
        </Button>
      </form>

      <div className="auth-divider">o</div>
      <GoogleLoginButton />

      <p className="auth-footer">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  )
}
