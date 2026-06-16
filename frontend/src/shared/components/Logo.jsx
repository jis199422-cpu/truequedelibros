export function Logo() {
  return (
    <div className="logo">
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
        <rect x="4" y="10" width="18" height="32" rx="3" fill="#4B0082" />
        <rect x="6" y="13" width="14" height="26" rx="1.5" fill="#F5E6CC" />
        <rect x="30" y="10" width="18" height="32" rx="3" fill="#FF6F61" />
        <rect x="32" y="13" width="14" height="26" rx="1.5" fill="#F5E6CC" />
        <path d="M22 23 L30 23 M22 29 L30 29" stroke="#4B0082" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M25 20 L27 23 L25 26" stroke="#4B0082" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">Trueque de Libros</span>
      <span className="logo-tagline">intercambia · descubre · lee</span>
    </div>
  )
}
