import client from './client'

export const getAdminStats = () => client.get('/admin/stats')
export const getAdminUsers = () => client.get('/admin/users')
export const toggleBanUser = (id) => client.put(`/admin/users/${id}/ban`)
export const getAdminBooks = () => client.get('/admin/books')
export const adminDeleteBook = (id) => client.delete(`/admin/books/${id}`)
