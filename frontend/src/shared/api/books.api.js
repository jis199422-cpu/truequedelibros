import client from './client'

export const likeBook = (bookId) => client.post(`/books/${bookId}/like`)
export const dislikeBook = (bookId) => client.post(`/books/${bookId}/dislike`)
export const unlikeBook = (bookId) => client.delete(`/books/${bookId}/like`)
export const getFeed = (cursor = null, genre = null, lat = null, lng = null) => {
  const params = new URLSearchParams()
  if (cursor) params.append('cursor', cursor)
  if (genre) params.append('genre', genre)
  if (lat != null) params.append('lat', lat)
  if (lng != null) params.append('lng', lng)
  return client.get(`/books/feed?${params}`)
}
export const getBook = (bookId) => client.get(`/books/${bookId}`)
export const createBook = (data) => client.post('/books', data)
export const updateBook = (bookId, data) => client.put(`/books/${bookId}`, data)
export const deleteBook = (bookId) => client.delete(`/books/${bookId}`)
export const getBookUploadUrl = (data) => client.post('/books/upload-url', data)
export const enrichBook = (data) => client.post('/books/enrich', data)
