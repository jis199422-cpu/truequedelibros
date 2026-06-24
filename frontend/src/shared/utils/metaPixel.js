const isDev = import.meta.env.DEV

if (isDev) console.log('[Meta Pixel] Initialized')

function fbqTrack(type, event, params) {
  if (isDev) console.log(`[Meta Pixel] ${event}`, params ?? '')
  if (!window.fbq) return
  window.fbq(type, event, params)
}

export const trackPageView = () => fbqTrack('track', 'PageView')

export const trackRegistrationStarted = (source) =>
  fbqTrack('trackCustom', 'registration_started', { source })

export const trackRegistrationCompleted = ({ authMethod, source }) =>
  fbqTrack('track', 'CompleteRegistration', { auth_method: authMethod, source })

export const trackFirstBookUploaded = ({ intent, bookTitle, bookGenre }) =>
  fbqTrack('trackCustom', 'first_book_uploaded', { intent, book_title: bookTitle, book_genre: bookGenre })

export const trackAuthPromptShown = (booksSwipedCount) =>
  fbqTrack('trackCustom', 'auth_prompt_shown', { books_swiped_count: booksSwipedCount })

export const trackAuthPromptCtaClicked = (booksSwipedCount) =>
  fbqTrack('trackCustom', 'auth_prompt_cta_clicked', { books_swiped_count: booksSwipedCount })

export const trackBookLiked = ({ bookTitle, bookGenre, ownerUserId }) =>
  fbqTrack('trackCustom', 'book_liked', { book_title: bookTitle, book_genre: bookGenre, owner_user_id: ownerUserId })

export const trackMatchCreated = ({ bookTitle, bookGenre, ownerUserId, conversationId }) =>
  fbqTrack('trackCustom', 'match_created', { book_title: bookTitle, book_genre: bookGenre, owner_user_id: ownerUserId, conversation_id: conversationId })

export const trackMessageSent = ({ conversationId, recipientUserId, isFirstMessage }) =>
  fbqTrack('trackCustom', 'message_sent', { conversation_id: conversationId, recipient_user_id: recipientUserId, is_first_message: isFirstMessage })

export const trackWishlistItemAdded = ({ bookTitle, source }) =>
  fbqTrack('trackCustom', 'wishlist_item_added', { book_title: bookTitle, source })

export const trackSectionViewed = (section) =>
  fbqTrack('trackCustom', 'section_viewed', { section })

export const trackPuntoSeguroLiked = ({ localName, bookTitle }) =>
  fbqTrack('trackCustom', 'punto_seguro_liked', { local_name: localName, book_title: bookTitle })

export const trackBeneficioCanjear = ({ localName, localId, promocionId }) =>
  fbqTrack('trackCustom', 'beneficio_canjear_clicked', { local_name: localName, local_id: localId, promocion_id: promocionId })

export const trackLocalBooksViewed = ({ localName, localId }) =>
  fbqTrack('trackCustom', 'local_books_viewed', { local_name: localName, local_id: localId })
