import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  adminCreateLocal, adminUpdateLocal, adminDeleteLocal,
  adminCreatePromocion, adminDeletePromocion,
  adminCreateLocalUser,
  uploadLogo,
  getLocales,
} from '../../beneficios/api/beneficios.api'
import { getAdminUsers } from '../../../shared/api/admin.api'

export function AdminLocalesPage() {
  const [locales, setLocales]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editLocal, setEditLocal] = useState(null)
  const [userForm, setUserForm]   = useState({ open: false, localId: null })
  const [promoForm, setPromoForm] = useState({ open: false, localId: null })
  const [showStandaloneUser, setShowStandaloneUser] = useState(false)

  const loadLocales = () => {
    setLoading(true)
    getLocales()
      .then(({ data }) => setLocales(data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadLocales() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('¿Desactivar este local?')) return
    try {
      await adminDeleteLocal(id)
      toast.success('Local desactivado')
      loadLocales()
    } catch { toast.error('Error al desactivar') }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Gestión de Locales</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{ ...styles.addBtn, background: '#6b7280' }} onClick={() => setShowStandaloneUser(true)}>
            + Nuevo usuario LOCAL
          </button>
          <button style={styles.addBtn} onClick={() => { setEditLocal(null); setShowForm(true) }}>
            + Nuevo local
          </button>
        </div>
      </div>

      {loading ? <p>Cargando…</p> : (
        <table style={styles.table}>
          <thead>
            <tr>
              {['Nombre', 'Dirección', 'Categoría', 'Dueño', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locales.map(l => (
              <tr key={l.id}>
                <td style={styles.td}>{l.name}</td>
                <td style={styles.td}>{l.address}</td>
                <td style={styles.td}>{l.category}</td>
                <td style={styles.td}>{l.ownerName}</td>
                <td style={styles.td}>
                  <span style={l.active !== false ? styles.badgeActive : styles.badgeOff}>
                    {l.active !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={styles.td}>
                  <button style={styles.actionBtn} onClick={() => { setEditLocal(l); setShowForm(true) }}>
                    Editar
                  </button>
                  <button style={styles.actionBtn} onClick={() => setPromoForm({ open: true, localId: l.id, localName: l.name })}>
                    Promos
                  </button>
                  <button style={styles.actionBtn} onClick={() => setUserForm({ open: true })}>
                    Usuario
                  </button>
                  <button style={{ ...styles.actionBtn, color: '#dc2626' }} onClick={() => handleDelete(l.id)}>
                    Desactivar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showForm && (
        <LocalFormModal
          local={editLocal}
          onClose={() => setShowForm(false)}
          onSaved={loadLocales}
        />
      )}

      {userForm.open && (
        <CreateUserModal
          onClose={() => setUserForm({ open: false })}
        />
      )}

      {promoForm.open && (
        <PromocionesModal
          localId={promoForm.localId}
          localName={promoForm.localName}
          onClose={() => setPromoForm({ open: false, localId: null })}
        />
      )}

      {showStandaloneUser && (
        <CreateUserModal
          onClose={() => setShowStandaloneUser(false)}
        />
      )}
    </div>
  )
}

function LocalFormModal({ local, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: local?.name ?? '',
    address: local?.address ?? '',
    logoUrl: local?.logoUrl ?? '',
    category: local?.category ?? 'GASTRONOMIA',
    ownerId: local?.ownerId ?? '',
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
      if (local) await adminUpdateLocal(local.id, form)
      else await adminCreateLocal(form)
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

function CreateUserModal({ onClose }) {
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

function PromocionesModal({ localId, localName, onClose }) {
  const [promos, setPromos]     = useState([])
  const [desc, setDesc]         = useState('')
  const [saving, setSaving]     = useState(false)

  const loadPromos = () =>
    getLocales().then(({ data }) => {
      const l = data.find(x => x.id === localId)
      if (l) setPromos(l.promociones)
    })

  useEffect(() => { loadPromos() }, [localId])

  const handleAdd = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await adminCreatePromocion(localId, { description: desc })
      setDesc('')
      loadPromos()
      toast.success('Promoción agregada')
    } catch { toast.error('Error al agregar') } finally { setSaving(false) }
  }

  const handleDelete = async (promoId) => {
    try {
      await adminDeletePromocion(localId, promoId)
      loadPromos()
      toast.success('Promoción eliminada')
    } catch { toast.error('Error al eliminar') }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginTop: 0 }}>Promociones — {localName}</h2>
        <ul style={{ margin: '0 0 16px', padding: 0, listStyle: 'none' }}>
          {promos.map(p => (
            <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ fontSize: 14, color: p.active ? '#333' : '#bbb' }}>{p.description}</span>
              <button style={{ ...styles.actionBtn, color: '#dc2626' }} onClick={() => handleDelete(p.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...styles.input, flex: 1, marginTop: 0 }}
            placeholder="Nueva promoción…"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            required
          />
          <button style={styles.saveBtn} disabled={saving}>Agregar</button>
        </form>
        <button style={{ ...styles.cancelBtn, marginTop: 16 }} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  )
}

const styles = {
  page: { padding: 24 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { margin: 0, fontSize: 22, fontWeight: 800 },
  addBtn: { padding: '10px 18px', background: '#5b8fa8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '10px 12px', background: '#f5f5f5', fontSize: 13, fontWeight: 700, borderBottom: '2px solid #e5e5e5' },
  td: { padding: '10px 12px', fontSize: 14, borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' },
  badgeActive: { padding: '2px 8px', borderRadius: 4, background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 700 },
  badgeOff: { padding: '2px 8px', borderRadius: 4, background: '#f3f4f6', color: '#6b7280', fontSize: 12, fontWeight: 700 },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#5b8fa8', fontWeight: 600, fontSize: 13, marginRight: 6 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto' },
  formStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { display: 'flex', flexDirection: 'column', fontSize: 13, fontWeight: 600, color: '#555', gap: 4 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14 },
  cancelBtn: { padding: '10px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' },
  saveBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: '#5b8fa8', color: '#fff', fontWeight: 700, cursor: 'pointer' },
}
