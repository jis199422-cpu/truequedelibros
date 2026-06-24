import { create } from 'zustand'
import useAuthStore from '../../auth/store/authStore'
import { acceptTerms } from '../../../shared/api/users.api'

const useTermsGateStore = create((set, get) => ({
  isOpen: false,
  pendingCallback: null,
  accepting: false,
  checked: false,

  requireTerms: (callback) => {
    const accepted = !!useAuthStore.getState().user?.termsAcceptedAt
    if (accepted) {
      callback?.()
      return
    }
    set({ isOpen: true, pendingCallback: callback ?? null, checked: false })
  },

  setChecked: (checked) => set({ checked }),

  accept: async () => {
    set({ accepting: true })
    try {
      const { data } = await acceptTerms()
      const { accessToken, setAuth } = useAuthStore.getState()
      setAuth(accessToken, data)
      const { pendingCallback } = get()
      set({ isOpen: false, pendingCallback: null, accepting: false, checked: false })
      pendingCallback?.()
    } catch {
      set({ accepting: false })
      throw new Error('No se pudieron guardar los términos')
    }
  },

  cancel: () => set({ isOpen: false, pendingCallback: null, checked: false }),
}))

export default useTermsGateStore
