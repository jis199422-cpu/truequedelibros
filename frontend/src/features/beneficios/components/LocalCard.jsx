import { useState } from 'react'
import { trackLocalBooksViewed } from '../../../shared/utils/metaPixel'

const PROMOS_VISIBLE = 2

export function LocalCard({ local, onCanjear, onVerLibros }) {
  const [expanded, setExpanded] = useState(false)

  const promos = local.promociones ?? []
  const visible = expanded ? promos : promos.slice(0, PROMOS_VISIBLE)
  const hidden  = promos.length - PROMOS_VISIBLE

  return (
    <div style={styles.card} onClick={() => onCanjear(local)} role="button" tabIndex={0}
         onKeyDown={e => e.key === 'Enter' && onCanjear(local)}>
      <div style={styles.header}>
        <div style={styles.logoWrap}>
          {local.logoUrl
            ? <img src={local.logoUrl} alt={local.name} style={styles.logo} />
            : <div style={styles.logoPlaceholder}>{local.name[0].toUpperCase()}</div>
          }
        </div>
        <div style={styles.info}>
          <span style={styles.categoryChip}>{local.category}</span>
          <h3 style={styles.name}>{local.name}</h3>
          <p style={styles.address}>{local.address}</p>
        </div>
      </div>

      {local.cartaUrl && (
        <a
          href={local.cartaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.cartaLink}
          onClick={e => e.stopPropagation()}
        >
          Ver carta
        </a>
      )}

      {promos.length > 0 && (
        <ul style={styles.promoList} onClick={e => e.stopPropagation()}>
          {visible.map(p => (
            <li key={p.id} style={styles.promoItem}>
              <span style={styles.bullet}>•</span>
              <span style={styles.promoText}>{p.description}</span>
            </li>
          ))}
          {promos.length > PROMOS_VISIBLE && (
            <li>
              <button
                style={styles.verMasBtn}
                onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
              >
                {expanded
                  ? 'Ver menos'
                  : `Ver más (${hidden} ${hidden === 1 ? 'promoción' : 'promociones'})`
                }
              </button>
            </li>
          )}
        </ul>
      )}

      {onVerLibros && (
        <button
          style={styles.verLibrosBtn}
          onClick={e => { e.stopPropagation(); trackLocalBooksViewed({ localName: local.name, localId: local.id }); onVerLibros(local) }}
        >
          Ver libros disponibles
        </button>
      )}
      <button
        style={styles.canjearBtn}
        onClick={e => { e.stopPropagation(); onCanjear(local) }}
      >
        Canjear beneficio
      </button>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff', borderRadius: 14, padding: 20,
    boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
    marginBottom: 16, cursor: 'pointer',
    transition: 'box-shadow 0.15s',
    outline: 'none',
  },
  header: { display: 'flex', gap: 14, marginBottom: 14 },
  logoWrap: { flexShrink: 0 },
  logo: { width: 68, height: 68, borderRadius: 10, objectFit: 'cover' },
  logoPlaceholder: {
    width: 68, height: 68, borderRadius: 10, background: '#e8f4f8',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26, fontWeight: 700, color: '#5b8fa8',
  },
  info: { flex: 1 },
  categoryChip: {
    fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
    background: '#e8f4f8', color: '#5b8fa8', borderRadius: 4,
    padding: '2px 8px', display: 'inline-block',
  },
  name: { margin: '6px 0 2px', fontSize: 16, fontWeight: 700, color: '#1a1a1a' },
  address: { margin: 0, fontSize: 13, color: '#888' },
  cartaLink: {
    display: 'inline-block', fontSize: 13, fontWeight: 600,
    color: '#5b8fa8', textDecoration: 'underline', marginBottom: 14,
  },
  promoList: { listStyle: 'none', margin: '0 0 16px', padding: 0 },
  promoItem: {
    display: 'flex', gap: 8, padding: '5px 0',
    borderTop: '1px solid #f5f5f5', fontSize: 14, color: '#444',
  },
  bullet: { color: '#5b8fa8', fontWeight: 700, flexShrink: 0 },
  promoText: { flex: 1 },
  verMasBtn: {
    background: 'none', border: 'none', color: '#5b8fa8',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '4px 0',
  },
  verLibrosBtn: {
    width: '100%', padding: '11px', borderRadius: 10,
    border: '1.5px solid #5b8fa8', background: '#fff',
    color: '#5b8fa8', fontSize: 15, fontWeight: 700,
    cursor: 'pointer', letterSpacing: 0.3, marginBottom: 10,
  },
  canjearBtn: {
    width: '100%', padding: '12px', borderRadius: 10, border: 'none',
    background: '#5b8fa8', color: '#fff', fontSize: 15,
    fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3,
  },
}
