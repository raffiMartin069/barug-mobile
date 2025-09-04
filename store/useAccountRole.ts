// store/useAccountRole.ts
import { fetchResidentPlus } from '@/services/profile'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
// TODO: add fetchStaffProfile / fetchBusinessProfile when you have them

export type Role = 'resident' | 'business' | 'staff'
type Profile = any
const MAX_AGE = 5 * 60_000 // 5 minutes

type Profiles = Partial<Record<Role, { data: Profile; cachedAt: number }>>

type State = {
  currentRole: Role | null
  staffId: number | null
  profiles: Profiles

  // role switchers
  setResident: () => void
  setBusiness: () => void
  setStaff: (staffId: number) => void

  // cache helpers
  getProfile: (role?: Role | null) => Profile | null
  setProfile: (role: Role, data: Profile) => void
  ensureLoaded: (role: Role, opts?: { force?: boolean }) => Promise<Profile | null>

  clearAll: () => void
}

export const useAccountRole = create<State>()(
  persist(
    (set, get) => ({
      currentRole: null,
      staffId: null,
      profiles: {},

      setResident: () => set({ currentRole: 'resident' }),
      setBusiness: () => set({ currentRole: 'business' }),
      setStaff: (staffId) => set({ currentRole: 'staff', staffId }),

      getProfile: (role = get().currentRole) =>
        role ? get().profiles[role]?.data ?? null : null,

      setProfile: (role, data) => {
        const profiles = { ...get().profiles, [role]: { data, cachedAt: Date.now() } }
        set({ profiles })
      },

      ensureLoaded: async (role, opts) => {
        const entry = get().profiles[role]
        const force = !!opts?.force
        const stale = !entry || Date.now() - entry.cachedAt > MAX_AGE
        if (!force && !stale) return entry?.data ?? null

        // fetch per role
        if (role === 'resident') {
          const { details, is_staff, staff_id } = await fetchResidentPlus()
          if (is_staff && staff_id) set({ staffId: staff_id })
          if (details) get().setProfile('resident', details)
          return details ?? null
        }

        if (role === 'staff') {
          // const details = await fetchStaffProfile()
          // if (details) get().setProfile('staff', details)
          return get().profiles.staff?.data ?? null
        }

        if (role === 'business') {
          // const details = await fetchBusinessProfile()
          // if (details) get().setProfile('business', details)
          return get().profiles.business?.data ?? null
        }

        return null
      },

      clearAll: () => set({ currentRole: null, staffId: null, profiles: {} }),
    }),
    { name: 'role-store-v1', storage: createJSONStorage(() => AsyncStorage) }
  )
)
