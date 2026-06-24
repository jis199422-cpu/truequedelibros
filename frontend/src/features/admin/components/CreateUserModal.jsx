import { useState } from 'react'
import toast from 'react-hot-toast'
import { adminCreateLocalUser } from '../../beneficios/api/beneficios.api'
import { modalStyles as styles } from './adminModalStyles'

export function CreateUserModal({ onClose }) {
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [saving, setSaving] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminCreateLocalUser(form)
      toast.success('Usuario LOCAL creado')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Error al crear usuario')
    } finally { setSaving(false) }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Crear usuario LOCAL</h2>
        <form onSubmit={handleSave} style={styles.formStack}>
          {[['Nombre', 'name', 'text'], ['Email', 'email', 'email'], ['Contraseña', 'password', 'password']].map(([label, key, type]) => (
            <label key={key} style={styles.label}>
              {label}
              <input
                style={styles.input}
                type={type}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
              />
            </label>
          ))}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button style={styles.saveBtn} disabled={saving}>
              {saving ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
