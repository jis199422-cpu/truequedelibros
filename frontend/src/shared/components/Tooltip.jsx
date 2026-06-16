import { useState, useEffect, useRef } from 'react'

export function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!visible) return
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [visible])

  return (
    <span
      ref={wrapperRef}
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={(e) => { e.stopPropagation(); setVisible((v) => !v) }}
    >
      {children}
      {visible && <span className="tooltip-box">{text}</span>}
    </span>
  )
}
