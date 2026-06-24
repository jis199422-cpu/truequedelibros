import { useEffect } from 'react'
import toast from 'react-hot-toast'
import useTermsGateStore from '../store/termsGateStore'
import { TERMS_TITLE, TERMS_PARAGRAPHS } from '../constants/termsText'

export function TermsAcceptanceModal() {
  const isOpen = useTermsGateStore((s) => s.isOpen)
  const accepting = useTermsGateStore((s) => s.accepting)
  const checked = useTermsGateStore((s) => s.checked)
  const setChecked = useTermsGateStore((s) => s.setChecked)
  const accept = useTermsGateStore((s) => s.accept)
  const cancel = useTermsGateStore((s) => s.cancel)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && cancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, cancel])

  if (!isOpen) return null

  const handleAccept = async () => {
    if (!checked) return
    try {
      await accept()
    } catch {
      toast.error('No se pudieron guardar los términos, intentá de nuevo')
    }
  }

  return (
    <div style={styles.overlay} onClick={cancel}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>{TERMS_TITLE}</h2>

        <div style={styles.scroll}>
          {TERMS_PARAGRAPHS.map((p, i) => (
            <div key={i} style={styles.paragraph}>
              {p.heading && <p style={styles.heading}>{p.heading}</p>}
              <p style={styles.body}>{p.body}</p>
            </div>
          ))}
        </div>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          Estoy de acuerdo
        </label>

        <div style={styles.actions}>
          <button style={styles.rejectBtn} onClick={cancel} disabled={accepting}>
            Rechazar
          </button>
          <button
            style={{ ...styles.acceptBtn, opacity: (!checked || accepting) ? 0.6 : 1 }}
            disabled={!checked || accepting}
            onClick={handleAccept}
          >
            {accepting ? 'Guardando…' : 'Aceptar términos y condiciones'}
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000, padding: 16,
  },
  modal: {
    background: '#fff', borderRadius: 16, padding: '24px 24px 20px',
    maxWidth: 480, width: '100%', maxHeight: '85vh',
    display: 'flex', flexDirection: 'column',
  },
  title: { margin: '0 0 12px', fontSize: 18, fontWeight: 800 },
  scroll: {
    overflowY: 'auto', flex: 1, paddingRight: 4, marginBottom: 16,
    border: '1px solid #eee', borderRadius: 10, padding: 12,
  },
  paragraph: { marginBottom: 12 },
  heading: { margin: '0 0 4px', fontSize: 14, fontWeight: 700 },
  body: { margin: 0, fontSize: 13, color: '#444', lineHeight: 1.5 },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 14, marginBottom: 16, cursor: 'pointer',
  },
  actions: { display: 'flex', gap: 10 },
  rejectBtn: {
    flex: 1, padding: '12px', borderRadius: 10, border: '1.5px solid #ddd',
    background: '#fff', color: '#555', fontSize: 14, fontWeight: 600, cursor: 'pointer',
  },
  acceptBtn: {
    flex: 2, padding: '12px', borderRadius: 10, border: 'none',
    background: '#5b8fa8', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
  },
}
