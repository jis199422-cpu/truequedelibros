import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../../../shared/components/Spinner'
import { requestHomeDelivery } from '../../../shared/api/support.api'

export function ManagedExchangeBanner({ conversationId }) {
  const navigate = useNavigate()
  const [deliveryStatus, setDeliveryStatus] = useState('idle')

  const handleHomeDelivery = async () => {
    setDeliveryStatus('loading')
    try {
      await requestHomeDelivery(conversationId)
      setDeliveryStatus('sent')
    } catch {
      setDeliveryStatus('error')
    }
  }

  if (deliveryStatus === 'loading') {
    return (
      <div className="mgex-banner">
        <span className="mgex-banner-text" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Spinner size="sm" />
          Enviando solicitud...
        </span>
      </div>
    )
  }

  if (deliveryStatus === 'sent') {
    return (
      <div className="mgex-banner">
        <span className="mgex-banner-text">
          ✓ Le avisamos al equipo de Trueque de Libros, te contactarán por correo para coordinar el envío.
        </span>
      </div>
    )
  }

  return (
    <div className="mgex-banner">
      <span className="mgex-banner-text">
        Podés reunirte o dejar el libro en los puntos seguros.{' '}
        <button className="mgex-banner-link" onClick={() => navigate('/puntos-seguros')}>
          Ver puntos seguros.
        </button>
        {' '}
        {deliveryStatus === 'error' && (
          <span style={{ color: '#e53e3e', fontSize: 12 }}>Error al enviar. </span>
        )}
        <button className="mgex-banner-link" onClick={handleHomeDelivery}>
          {deliveryStatus === 'error' ? 'Reintentar.' : 'Prefiero recibirlo en mi casa.'}
        </button>
      </span>
    </div>
  )
}
