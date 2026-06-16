import client from './client'

export const getWishlist = () => client.get('/wishlist')
export const addToWishlist = (bookTitle) => client.post('/wishlist', { bookTitle })
export const removeFromWishlist = (id) => client.delete(`/wishlist/${id}`)
