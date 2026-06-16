import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AuthLayout } from '../components/AuthLayout'
import { GoogleLoginButton } from '../components/GoogleLoginButton'
import { Input } from '../../../shared/components/Input'
import { Button } from '../../../shared/components/Button'
import { Logo } from '../../../shared/components/Logo'
import { login } from '../../../shared/api/auth.api'
import useAuthStore from '../store/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [form, setForm] = useState({ email: '', password: '' })
  const [rememberMe, setRememberMe] = useState(true)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await login({ ...form, rememberMe })
      setAuth(data.accessToken, data.user)
      navigate(data.user.role === 'LOCAL' ? '/local/dashboard' : '/feed', { replace: true })
    } catch (err) {
      const res = err.response?.data
      if (res?.fields) setErrors(res.fields)
      else toast.error(res?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-header">
        <Logo />
        <p className="auth-subtitle">Inicia sesión para intercambiar libros</p>
      </div>

      <form onSubmit={handleSubmit} className="form-stack">
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
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <label className="remember-me-label">
          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
          Mantener sesión iniciada
        </label>
        <Button type="submit" loading={loading}>
          Iniciar sesión
        </Button>
      </form>

      <p className="auth-footer">
        <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
      </p>

      <div className="auth-divider">o</div>
      <GoogleLoginButton />

      <p className="auth-footer">
        ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
      </p>
    </AuthLayout>
  )
}
