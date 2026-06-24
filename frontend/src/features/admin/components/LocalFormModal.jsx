import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminCreateLocal, adminUpdateLocal, uploadLogo } from '../../beneficios/api/beneficios.api'
import { getAdminUsers } from '../../../shared/api/admin.api'
import { modalStyles as styles } from './adminModalStyles'

export function LocalFormModal({ local, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: local?.name ?? '',
    address: local?.address ?? '',
    logoUrl: local?.logoUrl ?? '',
    cartaUrl: local?.cartaUrl ?? '',
    category: local?.category ?? 'GASTRONOMIA',
    ownerId: local?.ownerId ?? '',
    latitude: local?.latitude ?? '',
    longitude: local?.longitude ?? '',
  })
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview]     = useState(local?.logoUrl ?? null)
  const [localUsers, setLocalUsers] = useState([])

  useEffect(() => {
    getAdminUsers()
      .then(({ data }) => setLocalUsers(data.filter(u => u.role === 'LOCAL')))
      .catch(() => {})
  }, [])

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const imageUrl = await uploadLogo(file)
      setForm(f => ({ ...f, logoUrl: imageUrl }))
      toast.success('Logo subido')
    } catch {
      toast.error('Error al subir el logo')
      setPreview(form.logoUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
      }
      if (local) await adminUpdateLocal(local.id, payload)
      else await adminCreateLocal(payload)
      toast.success(local ? 'Local actualizado' : 'Local creado')
      onSaved(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.error ?? 'Error al guardar')
    } finally { setSaving(false) }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>{local ? 'Editar local' : 'Nuevo local'}</h2>
        <form onSubmit={handleSave} style={styles.formStack}>

          {/* Logo upload */}
          <label style={styles.label}>
            Logo
            <div style={logoStyles.uploadArea}>
              {preview
                ? <img src={preview} alt="logo" style={logoStyles.preview} />
                : <div style={logoStyles.placeholder}>Sin logo</div>
              }
              <label style={logoStyles.uploadBtn}>
                {uploading ? 'Subiendo…' : 'Cambiar imagen'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </label>

          {[['Nombre', 'name'], ['Dirección', 'address']].map(([label, key]) => (
            <label key={key} style={styles.label}>
              {label}
              <input
                style={styles.input}
                type="text"
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
              />
            </label>
          ))}

          <label style={styles.label}>
            Carta (link, opcional)
            <input
              style={styles.input}
              type="url"
              placeholder="https://..."
              value={form.cartaUrl}
              onChange={e => setForm(f => ({ ...f, cartaUrl: e.target.value }))}
            />
            <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>
              Dejalo vacío si el local no tiene carta (ej. dietética, librería).
            </span>
          </label>

          <div style={{ display: 'flex', gap: 10 }}>
            <label style={{ ...styles.label, flex: 1 }}>
              Latitud (opcional)
              <input
                style={styles.input}
                type="number"
                step="any"
                placeholder="-32.8908"
                value={form.latitude}
                onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))}
              />
            </label>
            <label style={{ ...styles.label, flex: 1 }}>
              Longitud (opcional)
              <input
                style={styles.input}
                type="number"
                step="any"
                placeholder="-68.8272"
                value={form.longitude}
                onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))}
              />
            </label>
          </div>
          <span style={{ fontSize: 12, color: '#888', fontWeight: 400, marginTop: -6 }}>
            Podés copiar las coordenadas de Google Maps. Son necesarias para que los libros de
            punto seguro de este local aparezcan ordenados por cercanía en el feed.
          </span>

          <label style={styles.label}>
            Dueño del local
            {localUsers.length === 0
              ? <p style={{ margin: '4px 0 0', fontSize: 13, color: '#d97706' }}>
                  No hay usuarios con rol LOCAL. Creá uno primero con el botón "+ Nuevo usuario LOCAL".
                </p>
              : <select
                  style={styles.input}
                  value={form.ownerId}
                  onChange={e => setForm(f => ({ ...f, ownerId: e.target.value }))}
                  required
                >
                  <option value="">Seleccioná un usuario…</option>
                  {localUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email}
                    </option>
                  ))}
                </select>
            }
          </label>

          <label style={styles.label}>
            Categoría
            <select
              style={styles.input}
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {['GASTRONOMIA', 'LIBRERIA', 'OTROS'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button style={styles.saveBtn} disabled={saving || uploading}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const logoStyles = {
  uploadArea: { display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 },
  preview: { width: 80, height: 80, borderRadius: 8, objectFit: 'cover', border: '1px solid #e5e5e5' },
  placeholder: {
    width: 80, height: 80, borderRadius: 8, background: '#f3f4f6',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, color: '#9ca3af', border: '1px dashed #d1d5db',
  },
  uploadBtn: {
    padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd',
    background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    color: '#374151',
  },
}
