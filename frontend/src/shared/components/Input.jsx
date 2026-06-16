export function Input({ label, error, className = '', ...props }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <input
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}
