import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getLocales, adminCreatePromocion, adminDeletePromocion } from '../../beneficios/api/beneficios.api'
import { modalStyles as styles } from './adminModalStyles'

export function PromocionesModal({ localId, localName, onClose }) {
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
