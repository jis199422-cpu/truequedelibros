import { useState, useCallback, useEffect } from 'react'
import { validarCupon } from '../api/beneficios.api'

export function ValidarCuponPanel({ localId, initialCode = '' }) {
  const [code, setCode]       = useState(initialCode)
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const validate = useCallback(async (codeToValidate) => {
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await validarCupon(localId, { code: codeToValidate })
      setResult(data)
      if (!data.valid) setError(data.message)
      else setCode('')
    } catch (err) {
      setError(err.response?.data?.error ?? 'Error al validar el cupón')
    } finally {
      setLoading(false)
    }
  }, [localId])

  useEffect(() => {
    if (initialCode.length === 5) validate(initialCode)
  }, [initialCode, validate])

  const handleSubmit = (e) => {
    e.preventDefault()
    validate(code)
  }

  return (
    <div style={s.panel}>
      <h2 style={s.title}>Validar cupón</h2>

      <form onSubmit={handleSubmit} style={s.form}>
        <input
          style={s.input}
          placeholder="Código (5 caracteres)"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-F0-9]/g, ''))}
          maxLength={5}
          autoComplete="off"
          autoFocus={!initialCode}
        />
        <button
          type="submit"
          style={{ ...s.btn, opacity: (loading || code.length !== 5) ? 0.6 : 1 }}
          disabled={loading || code.length !== 5}
        >
          {loading ? 'Validando…' : 'Validar'}
        </button>
      </form>

      {result?.valid && (
        <div style={s.success}>
          <p style={s.successTitle}>✓ Cupón válido</p>
          <p style={{ margin: '4px 0' }}>Usuario: <strong>{result.userName}</strong></p>
          <p style={{ fontSize: 13, color: '#555', margin: '4px 0 0' }}>{result.promotionName}</p>
        </div>
      )}

      {error && <p style={s.errorMsg}>{error}</p>}
    </div>
  )
}

const s = {
  panel: {
    background: '#fff', borderRadius: 12, padding: 24,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', flex: 1, minWidth: 280,
  },
  title:  { margin: '0 0 16px', fontSize: 18, fontWeight: 700 },
  form:   { display: 'flex', flexDirection: 'column', gap: 10 },
  input: {
    width: '100%', padding: '12px 14px', borderRadius: 8, border: '1.5px solid #ddd',
    fontSize: 18, fontFamily: 'monospace', letterSpacing: 4, textTransform: 'uppercase',
    boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '12px 8px', borderRadius: 8, border: 'none',
    background: '#5b8fa8', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
  },
  success: {
    marginTop: 16, padding: 16, borderRadius: 8,
    background: '#f0fdf4', border: '1px solid #86efac',
  },
  successTitle: { color: '#16a34a', fontWeight: 700, fontSize: 16, margin: '0 0 6px' },
  errorMsg: {
    marginTop: 12, padding: 12, borderRadius: 8,
    background: '#fef2f2', color: '#dc2626', fontSize: 14, margin: '12px 0 0',
  },
}
