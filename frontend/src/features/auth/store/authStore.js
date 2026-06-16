import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      initialized: false,

      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set((s) => ({ ...s, accessToken })),
      updateUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
      clearAuth: () => set({ accessToken: null, user: null }),
      setInitialized: () => set({ initialized: true }),
    }),
    {
      name: 'trueque-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export default useAuthStore
