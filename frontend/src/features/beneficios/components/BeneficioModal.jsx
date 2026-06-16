import { useEffect, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import toast from 'react-hot-toast'
import { getCuponActivo, generarCupon, cancelarCupon } from '../api/beneficios.api'

// fase: 'loading' | 'selecting' | 'active' | 'validado'

// Backend sends LocalDateTime without timezone (no 'Z'). Docker runs in UTC.
// Append 'Z' so the browser parses it as UTC instead of local time.
const parseUTC = (str) => new Date(str.endsWith('Z') ? str : str + 'Z')

export function BeneficioModal({ local, onClose }) {
  const [fase, setFase]           = useState('loading')
  const [cupon, setCupon]         = useState(null)
  const [promoId, setPromoId]     = useState('')
  const [canjeando, setCanjeando] = useState(false)
  const [cancelando, setCancelando] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const secondsLeftRef = useRef(0)

  const promos = (local.promociones ?? []).filter(p => p.active !== false)

  // Al abrir: verificar si ya existe un cupón activo
  useEffect(() => {
    getCuponActivo(local.id)
      .then(({ data }) => {
        setCupon(data)
        setFase('active')
      })
      .catch(err => {
        if (err.response?.status === 404) setFase('selecting')
        else { toast.error('Error al verificar cupón'); setFase('selecting') }
      })
  }, [local.id])

  // Cerrar con Escape
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  // Countdown cuando hay cupón activo
  useEffect(() => {
    if (fase !== 'active' || !cupon) return
    const diff = parseUTC(cupon.expiresAt) - Date.now()
    const initial = Math.min(900, Math.max(0, Math.floor(diff / 1000)))
    setSecondsLeft(initial)
    secondsLeftRef.current = initial
    if (initial <= 0) return
    const id = setInterval(() =>
      setSecondsLeft(s => {
        const next = s <= 1 ? (clearInterval(id), 0) : s - 1
        secondsLeftRef.current = next
        return next
      }), 1000)
    return () => clearInterval(id)
  }, [fase, cupon])

  // Polling para detectar validación por el cajero
  useEffect(() => {
    if (fase !== 'active' || !cupon) return
    const id = setInterval(() => {
      getCuponActivo(local.id).catch(err => {
        if (err.response?.status === 404 && secondsLeftRef.current > 10) {
          setFase('validado')
        }
      })
    }, 4000)
    return () => clearInterval(id)
  }, [fase, cupon, local.id])

  const handleCanjear = async () => {
    if (!promoId) { toast.error('Seleccioná una promoción'); return }
    setCanjeando(true)
    try {
      const { data } = await generarCupon({ localId: local.id, promocionId: promoId })
      setCupon(data)
      setFase('active')
    } catch (err) {
      if (err.response?.status === 409) {
        try {
          const { data } = await getCuponActivo(local.id)
          setCupon(data)
          setFase('active')
        } catch {
          toast.error('Error al recuperar el cupón activo')
        }
      } else {
        toast.error(err.response?.data?.error ?? 'No se pudo generar el cupón')
      }
    } finally {
      setCanjeando(false)
    }
  }

  const handleCancelar = async () => {
    if (!cupon) return
    setCancelando(true)
    try {
      await cancelarCupon(cupon.cuponId)
      setCupon(null)
      setPromoId('')
      setFase('selecting')
    } catch {
      toast.error('No se pudo cancelar el cupón')
    } finally {
      setCancelando(false)
    }
  }

  const mins    = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs    = String(secondsLeft % 60).padStart(2, '0')
  const expired = secondsLeft === 0 && fase === 'active'

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
        <h2 style={styles.localName}>{local.name}</h2>

        {/* ── LOADING ── */}
        {fase === 'loading' && (
          <div style={styles.center}>
            <div style={styles.spinner} />
          </div>
        )}

        {/* ── SELECTING ── */}
        {fase === 'selecting' && (
          <>
            <p style={styles.subtitle}>Elegí el descuento que querés canjear</p>

            {promos.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center' }}>
                No hay promociones activas en este local.
              </p>
            ) : (
              <>
                <select
                  style={styles.select}
                  value={promoId}
                  onChange={e => setPromoId(e.target.value)}
                >
                  <option value="">Seleccioná una promoción…</option>
                  {promos.map(p => (
                    <option key={p.id} value={p.id}>{p.description}</option>
                  ))}
                </select>

                <button
                  style={{ ...styles.canjearBtn, opacity: (canjeando || !promoId) ? 0.6 : 1 }}
                  disabled={canjeando || !promoId}
                  onClick={handleCanjear}
                >
                  {canjeando ? 'Generando…' : 'Canjear'}
                </button>
              </>
            )}
          </>
        )}

        {/* ── VALIDADO ── */}
        {fase === 'validado' && (
          <div style={styles.validadoWrap}>
            <div style={styles.checkCircle}>✓</div>
            <p style={styles.validadoTitle}>¡Cupón canjeado!</p>
            <p style={styles.validadoSub}>Tu descuento fue aplicado en {local.name}.</p>
            <button style={styles.canjearBtn} onClick={onClose}>Cerrar</button>
          </div>
        )}

        {/* ── ACTIVE (QR) ── */}
        {fase === 'active' && cupon && (
          <>
            <p style={styles.subtitle}>
              Mostrá este código al local para validarlo
            </p>

            <div style={styles.qrWrap}>
              <QRCodeSVG
                value={`${import.meta.env.VITE_FRONTEND_URL}/local/dashboard?code=${cupon.code}`}
                size={190}
              />
            </div>

            <div style={styles.code}>{cupon.code}</div>

            {expired
              ? <p style={{ ...styles.countdown, color: '#e53e3e' }}>Cupón expirado</p>
              : <p style={styles.countdown}>Expira en {mins}:{secs}</p>
            }

            {!expired && secondsLeft < 120 && (
              <p style={styles.urgency}>¡Menos de 2 minutos! Mostralo ahora.</p>
            )}

            <p style={styles.disclaimer}>
              Código personal e intransferible. Válido por 15 minutos.
            </p>

            <button
              style={{ ...styles.cancelBtn, opacity: cancelando ? 0.6 : 1 }}
              disabled={cancelando}
              onClick={handleCancelar}
            >
              {cancelando ? 'Cancelando…' : '← Cambiar promoción'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '32px 24px',
    maxWidth: 360, width: '100%', textAlign: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: 12, right: 14,
    background: 'none', border: 'none', fontSize: 18,
    cursor: 'pointer', color: '#888',
  },
  localName: { margin: '0 0 4px', fontSize: 20, fontWeight: 700 },
  subtitle: { margin: '0 0 20px', fontSize: 14, color: '#666' },
  center: { display: 'flex', justifyContent: 'center', padding: '32px 0' },
  spinner: {
    width: 36, height: 36, border: '3px solid #e5e5e5',
    borderTopColor: '#5b8fa8', borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
  },
  select: {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    border: '1.5px solid #ddd', fontSize: 14, marginBottom: 16,
    background: '#fff', textAlign: 'left',
  },
  canjearBtn: {
    width: '100%', padding: '13px', borderRadius: 10, border: 'none',
    background: '#5b8fa8', color: '#fff', fontSize: 15,
    fontWeight: 700, cursor: 'pointer',
  },
  qrWrap: {
    display: 'flex', justifyContent: 'center',
    padding: 16, background: '#f9f9f9', borderRadius: 12, marginBottom: 20,
  },
  code: {
    fontFamily: 'monospace', fontSize: 32, fontWeight: 700,
    letterSpacing: 8, color: '#1a1a1a', marginBottom: 12,
  },
  countdown: { fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: '#5b8fa8' },
  urgency: { fontSize: 14, color: '#d97706', fontWeight: 600, marginBottom: 8 },
  validadoWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '8px 0 4px' },
  checkCircle: {
    width: 72, height: 72, borderRadius: '50%',
    background: '#f0fdf4', border: '3px solid #86efac',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 36, color: '#16a34a', fontWeight: 700,
  },
  validadoTitle: { margin: 0, fontSize: 20, fontWeight: 800, color: '#15803d' },
  validadoSub: { margin: 0, fontSize: 14, color: '#555', textAlign: 'center' },
  disclaimer: {
    fontSize: 12, color: '#888', marginTop: 16,
    borderTop: '1px solid #f0f0f0', paddingTop: 12, marginBottom: 12,
  },
  cancelBtn: {
    background: 'none', border: 'none', color: '#888',
    fontSize: 13, cursor: 'pointer', padding: '4px 8px',
    textDecoration: 'underline',
  },
}
