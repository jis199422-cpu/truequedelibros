import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const todayKey = () => new Date().toISOString().slice(0, 10)

const useLikeGateStore = create(
  persist(
    (set, get) => ({
      dailyCount: 0,
      dailyLimit: 10,
      isPremium: false,
      hasBooks: false,
      warningShown: {},
      dateKey: '',
      resetAt: null,

      setDailyStatus: (count, limit, premium, resetAt, hasBooks = false) => {
        const today = todayKey()
        set((s) => ({
          dailyCount: count,
          dailyLimit: limit,
          isPremium: premium,
          hasBooks,
          resetAt: resetAt ?? null,
          dateKey: today,
          warningShown: s.dateKey !== today ? {} : s.warningShown,
        }))
      },

      incrementCount: () =>
        set((s) => {
          const today = todayKey()
          const isNewDay = s.dateKey !== today
          return {
            dailyCount: isNewDay ? 1 : s.dailyCount + 1,
            dateKey: today,
            ...(isNewDay ? { warningShown: {} } : {}),
          }
        }),

      markWarningShown: (userId) =>
        set((s) => ({ warningShown: { ...s.warningShown, [userId]: true } })),
    }),
    {
      name: 'like-gate',
      partialize: (s) => ({
        dailyCount: s.dailyCount,
        dailyLimit: s.dailyLimit,
        isPremium: s.isPremium,
        hasBooks: s.hasBooks,
        warningShown: s.warningShown,
        dateKey: s.dateKey,
        resetAt: s.resetAt,
      }),
    }
  )
)

export default useLikeGateStore
