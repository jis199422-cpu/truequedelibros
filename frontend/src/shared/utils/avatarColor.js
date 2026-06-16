const PALETTE = [
  { background: '#7c3aed', color: '#fff' },
  { background: '#0891b2', color: '#fff' },
  { background: '#059669', color: '#fff' },
  { background: '#d97706', color: '#fff' },
  { background: '#dc2626', color: '#fff' },
  { background: '#db2777', color: '#fff' },
  { background: '#2563eb', color: '#fff' },
  { background: '#9333ea', color: '#fff' },
  { background: '#0284c7', color: '#fff' },
  { background: '#15803d', color: '#fff' },
]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getAvatarColor(seed) {
  if (!seed) return PALETTE[0]
  return PALETTE[hashString(seed) % PALETTE.length]
}
