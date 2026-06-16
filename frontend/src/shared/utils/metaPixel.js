const isDev = import.meta.env.DEV

if (isDev) console.log('[Meta Pixel] Initialized')

export const trackPageView = () => {
  if (!window.fbq) return
  window.fbq('track', 'PageView')
  if (isDev) console.log('[Meta Pixel] PageView')
}

export const trackLead = () => {
  if (!window.fbq) return
  window.fbq('track', 'Lead')
  if (isDev) console.log('[Meta Pixel] Lead')
}

export const trackCompleteRegistration = () => {
  if (!window.fbq) return
  window.fbq('track', 'CompleteRegistration')
  if (isDev) console.log('[Meta Pixel] CompleteRegistration')
}

export const trackEvent = (event, params) => {
  if (!window.fbq) return
  window.fbq('track', event, params)
  if (isDev) console.log(`[Meta Pixel] ${event}`, params ?? '')
}
