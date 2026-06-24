export const modalStyles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 },
  modal: { background: '#fff', borderRadius: 12, padding: 28, maxWidth: 480, width: '100%', maxHeight: '80vh', overflowY: 'auto' },
  formStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { display: 'flex', flexDirection: 'column', fontSize: 13, fontWeight: 600, color: '#555', gap: 4 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #ddd', fontSize: 14 },
  cancelBtn: { padding: '10px 18px', borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' },
  saveBtn: { padding: '10px 18px', borderRadius: 8, border: 'none', background: '#5b8fa8', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  actionBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#5b8fa8', fontWeight: 600, fontSize: 13, marginRight: 6 },
}
