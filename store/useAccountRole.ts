// store/useAccountRole.ts
import { fetchResidentPlus } from '@/services/profile'
// import { fetchStaffProfile } from '@/services/staff'      // TODO: add when ready
// import { fetchBusinessProfile } from '@/services/business' // TODO: add when ready
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Role = 'resident' | 'business' | 'staff'
type Profile = any

/** How long a cached profile is considered fresh (ms). */
const MAX_AGE = 5 * 60_000 // 5 minutes

type Profiles = Partial<Record<Role, { data: Profile; cachedAt: number }>>

type State = {
  /** Which role the user is currently using in the UI. */
  currentRole: Role | null
  /** If the user is staff, we store the staffId here after the first successful fetch. */
  staffId: number | null
  /** Per-role cached profile objects, persisted to AsyncStorage. */
  profiles: Profiles

  // ---- Role switchers ----
  setResident: () => void
  setBusiness: () => void
  setStaff: (staffId: number) => void

  // ---- Cache helpers ----
  /** Get profile for a role (defaults to currentRole). Returns null if missing. */
  getProfile: (role?: Role | null) => Profile | null
  /** Write profile to cache for a role and timestamp it. */
  setProfile: (role: Role, data: Profile) => void
  /**
   * Ensure a profile is available and fresh in the cache.
   * - Returns cached data if fresh (<= MAX_AGE) and force !== true
   * - Otherwise fetches the profile for that role, stores it, and returns it.
   */
  ensureLoaded: (role: Role, opts?: { force?: boolean }) => Promise<Profile | null>

  /** Clear *everything* (use on logout). */
  clearAll: () => void
}

export const useAccountRole = create<State>()(
  persist(
    (set, get) => ({
      currentRole: null,
      staffId: null,
      profiles: {},

      // ---- Role switchers ----
      setResident: () => set({ currentRole: 'resident' }),
      setBusiness: () => set({ currentRole: 'business' }),
      setStaff: (staffId) => set({ currentRole: 'staff', staffId }),

      // ---- Cache helpers ----
      getProfile: (role = get().currentRole) =>
        role ? get().profiles[role]?.data ?? null : null,

      setProfile: (role, data) => {
        const profiles = {
          ...get().profiles,
          [role]: { data, cachedAt: Date.now() },
        }
        set({ profiles })
      },

      ensureLoaded: async (role, opts) => {
        const entry = get().profiles[role]
        const force = !!opts?.force
        const stale = !entry || Date.now() - entry.cachedAt > MAX_AGE

        if (!force && !stale) {
          // fresh cache → return immediately
          return entry?.data ?? null
        }

        // ---- Fetch per role ----
        if (role === 'resident') {
          // Your API returns: { details, is_staff, staff_id }
          const { details, is_staff, staff_id } = await fetchResidentPlus()
          if (is_staff && staff_id && get().staffId !== staff_id) {
            set({ staffId: staff_id })
          }
          if (details) get().setProfile('resident', details)
          return details ?? null
        }

        if (role === 'staff') {
          // TODO: Replace with your actual staff fetcher:
          // const details = await fetchStaffProfile()
          // if (details) get().setProfile('staff', details)
          return get().profiles.staff?.data ?? null
        }

        if (role === 'business') {
          // TODO: Replace with your actual business fetcher:
          // const details = await fetchBusinessProfile()
          // if (details) get().setProfile('business', details)
          return get().profiles.business?.data ?? null
        }

        return null
      },

      clearAll: () => set({ currentRole: null, staffId: null, profiles: {} }),
    }),
    {
      name: 'role-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Optional: version/migration hooks can go here later
    }
  )
)
