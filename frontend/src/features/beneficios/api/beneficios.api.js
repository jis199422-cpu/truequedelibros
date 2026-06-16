import client from '../../../shared/api/client'
import { uploadToS3 } from '../../../shared/api/users.api'

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
  const { data } = await getLogoUploadUrl(file.name, file.type)
  await uploadToS3(data.uploadUrl, file)
  return data.imageUrl
}
