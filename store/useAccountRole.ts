// store/useAccountRole.ts
import { fetchResidentPlus } from '@/services/profile'
// import { fetchStaffProfile } from '@/services/staff'
// import { fetchBusinessProfile } from '@/services/business'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Role = 'resident' | 'business' | 'staff'
type Profile = any

/** How long a cached profile is considered fresh (ms). */
const MAX_AGE = 5 * 60_000 // 5 minutes

type Profiles = Partial<Record<Role, { data: Profile; cachedAt: number }>>

type State = {
  /** Persist hydration is finished. Useful to avoid reading before cache is available. */
  hasHydrated: boolean
  /** Promise you can await to ensure hydration finished before doing anything. */
  waitForHydration: () => Promise<void>

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
   * - Waits for hydration first (so we can return from cached immediately if fresh)
   * - Returns cached data if fresh (<= MAX_AGE) and force !== true
   * - Otherwise fetches the profile for that role, stores it, and returns it.
   * - On fetch error, returns the last known cached data (no throw).
   */
  ensureLoaded: (role: Role, opts?: { force?: boolean }) => Promise<Profile | null>

  /** Clear *everything* (use on logout). */
  clearAll: () => void
}

/* ---------- Hydration gate (module-scope) ---------- */
let resolveHydration: (() => void) | null = null
const hydrationPromise = new Promise<void>((res) => { resolveHydration = res })

export const useAccountRole = create<State>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      waitForHydration: () => hydrationPromise,

      // If most screens assume 'resident', make this the default to reduce null checks.
      currentRole: 'resident',
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
        // 1) Wait for hydration, so the cache is available immediately if present.
        await get().waitForHydration()

        const entry = get().profiles[role]
        const force = !!opts?.force
        const stale = !entry || Date.now() - entry.cachedAt > MAX_AGE

        // 2) Fast path: fresh cache → return immediately
        if (!force && !stale) {
          return entry?.data ?? null
        }

        // 3) Fetch per-role (with error protection). On error, return last cache.
        try {
          if (role === 'resident') {
            // Your API returns: { details, is_staff, staff_id }
            const { details, is_staff, staff_id } = await fetchResidentPlus()
            if (is_staff && staff_id && get().staffId !== staff_id) {
              set({ staffId: staff_id })
            }
            if (details) get().setProfile('resident', details)
            return details ?? entry?.data ?? null
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

          return entry?.data ?? null
        } catch (e) {
          // 4) Never throw to the UI. Return whatever is cached (may be null).
          console.log('[ensureLoaded] fetch failed:', e)
          return entry?.data ?? null
        }
      },

      clearAll: () => set({ currentRole: 'resident', staffId: null, profiles: {} }),
    }),
    {
      name: 'role-store-v1',
      storage: createJSONStorage(() => AsyncStorage),

      // Let components know when hydration finishes.
      onRehydrateStorage: () => {
        // runs *before* rehydration
        return (state, error) => {
          // runs *after* rehydration
          if (error) {
            console.log('[useAccountRole] rehydrate error:', error)
          }
          // mark hydrated and resolve the gate
          state?.hasHydrated === false && set({ hasHydrated: true })
          resolveHydration?.()
        }
      },
    }
  )
)
