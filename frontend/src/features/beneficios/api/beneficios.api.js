import client from '../../../shared/api/client'
import { uploadToS3 } from '../../../shared/api/users.api'
import { resizeImage } from '../../../shared/utils/imageResize'

export const getLocales    = ()     => client.get('/locales')
export const getLocal      = (id)   => client.get(`/locales/${id}`)

export const generarCupon   = (data)     => client.post('/beneficios/generar', data)
export const getMisCupones  = ()         => client.get('/beneficios/mis-cupones')
export const getCuponActivo = (localId)  => client.get(`/beneficios/activo/${localId}`)
export const cancelarCupon  = (cuponId)  => client.delete(`/beneficios/${cuponId}`)

export const validarCupon    = (localId, data)   => client.post(`/locales/${localId}/cupones/validar`, data)
export const getEstadisticas = (localId)          => client.get(`/locales/${localId}/estadisticas`)
export const getCanjes       = (localId, page = 0) => client.get(`/locales/${localId}/canjes`, { params: { page } })

export const adminCreateLocal      = (data)             => client.post('/admin/locales', data)
export const adminUpdateLocal      = (id, data)         => client.put(`/admin/locales/${id}`, data)
export const adminDeleteLocal      = (id)               => client.delete(`/admin/locales/${id}`)
export const adminCreatePromocion  = (localId, data)    => client.post(`/admin/locales/${localId}/promociones`, data)
export const adminUpdatePromocion  = (localId, id, data) => client.put(`/admin/locales/${localId}/promociones/${id}`, data)
export const adminDeletePromocion  = (localId, id)      => client.delete(`/admin/locales/${localId}/promociones/${id}`)
export const adminCreateLocalUser  = (data) => client.post('/admin/local-users', data)

export const getLogoUploadUrl = (fileName, contentType) =>
  client.post('/admin/locales/logo-upload-url', { fileName, contentType })

export const uploadLogo = async (file) => {
  let resized = file
  try {
    resized = await resizeImage(file, { maxWidth: 600, maxHeight: 600 })
  } catch {
    // si falla el resize, se sube el archivo original
  }
  const { data } = await getLogoUploadUrl(resized.name, resized.type)
  await uploadToS3(data.uploadUrl, resized)
  return data.imageUrl
}

// ── Libros de punto seguro ───────────────────────────────────────────────────

export const getLocalPublicBooks    = (localId)         => client.get(`/locales/${localId}/books`)
export const reportBookUnavailable  = (localId, bookId, message) => client.post(`/locales/${localId}/books/${bookId}/report`, { message: message || null })

export const getLocalBooks       = (localId)            => client.get(`/admin/locales/${localId}/books`)
export const adminCreateLocalBook = (localId, data)      => client.post(`/admin/locales/${localId}/books`, data)
export const adminUpdateLocalBook = (localId, id, data)  => client.put(`/admin/locales/${localId}/books/${id}`, data)
export const adminDeleteLocalBook = (localId, id)        => client.delete(`/admin/locales/${localId}/books/${id}`)

export const uploadBookCover = async (file) => {
  let resized = file
  try {
    resized = await resizeImage(file, { maxWidth: 800, maxHeight: 800 })
  } catch {
    // si falla el resize, se sube el archivo original
  }
  const { data } = await client.post('/books/upload-url', { fileName: resized.name, contentType: resized.type })
  await uploadToS3(data.uploadUrl, resized)
  return data.imageUrl
}
