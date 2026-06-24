import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { adminDeleteLocal, getLocales } from '../../beneficios/api/beneficios.api'
import { LocalFormModal } from '../components/LocalFormModal'
import { CreateUserModal } from '../components/CreateUserModal'
import { PromocionesModal } from '../components/PromocionesModal'
import { PuntoSeguroBooksModal } from '../components/PuntoSeguroBooksModal'

export function AdminLocalesPage() {
  const [locales, setLocales]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [editLocal, setEditLocal] = useState(null)
  const [userForm, setUserForm]   = useState({ open: false, localId: null })
  const [promoForm, setPromoForm] = useState({ open: false, localId: null })
  const [booksForm, setBooksForm] = useState({ open: false, localId: null })
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
                  <button style={styles.actionBtn} onClick={() => setBooksForm({ open: true, localId: l.id, localName: l.name })}>
                    Libros
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

      {booksForm.open && (
        <PuntoSeguroBooksModal
          localId={booksForm.localId}
          localName={booksForm.localName}
          onClose={() => setBooksForm({ open: false, localId: null })}
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
}
