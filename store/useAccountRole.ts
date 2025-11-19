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
  hasHydrated: boolean
  waitForHydration: () => Promise<void>

  currentRole: Role | null
  staffId: number | null
  profiles: Profiles

  setResident: () => void
  setBusiness: () => void
  setStaff: (staffId: number) => void

  getProfile: (role?: Role | null) => Profile | null
  setProfile: (role: Role, data: Profile) => void
  ensureLoaded: (role: Role, opts?: { force?: boolean }) => Promise<Profile | null>

  clearAll: () => void
}

/* ---------- Hydration gate (module-scope) ---------- */
let resolveHydration: (() => void) | null = null
const hydrationPromise = new Promise<void>((res) => { resolveHydration = res })

/* ---------- EXPECTED FIELDS for Household & Family ---------- */
const EXPECTED_HOUSEHOLD_FIELDS = [
  'household_head_first_name',
  'household_head_middle_name',
  'household_head_last_name',
  'household_head_suffix',
  'household_num',
  'house_type',
  'house_ownership',
]

const EXPECTED_FAMILY_FIELDS = [
  'family_head_first_name',
  'family_head_middle_name',
  'family_head_last_name',
  'family_head_suffix',
  'family_num',
  'household_type',
  'nhts_status',
  'indigent_status',
  'source_of_income',
  'family_monthly_income',
]

/* ---------- Debug Helpers ---------- */
function summarize(obj: any) {
  if (!obj || typeof obj !== 'object') return obj
  const keys = Object.keys(obj)
  return { keysCount: keys.length, sampleKeys: keys.slice(0, 20) }
}

function missingKeys(obj: any, expected: string[]) {
  return expected.filter((k) => obj?.[k] === undefined)
}

function debugResidentProfile(prefix: string, details: any) {
  // High level
  console.log(`[RoleStore][${prefix}] details summary:`, summarize(details))

  // Print some identity basics
  const idBasics = {
    person_id: details?.person_id,
    person_code: details?.person_code,
    name: [details?.first_name, details?.middle_name, details?.last_name, details?.suffix].filter(Boolean).join(' '),
  }
  console.table(idBasics)

  // Household block
  const hhPick = Object.fromEntries(EXPECTED_HOUSEHOLD_FIELDS.map(k => [k, details?.[k]]))
  console.log(`[RoleStore][${prefix}] HOUSEHOLD fields:`)
  console.table(hhPick)
  const hhMissing = missingKeys(details, EXPECTED_HOUSEHOLD_FIELDS)
  if (hhMissing.length) console.warn(`[RoleStore][${prefix}] Missing household fields:`, hhMissing)

  // Family block
  const famPick = Object.fromEntries(EXPECTED_FAMILY_FIELDS.map(k => [k, details?.[k]]))
  console.log(`[RoleStore][${prefix}] FAMILY fields:`)
  console.table(famPick)
  const famMissing = missingKeys(details, EXPECTED_FAMILY_FIELDS)
  if (famMissing.length) console.warn(`[RoleStore][${prefix}] Missing family fields:`, famMissing)
}

export const useAccountRole = create<State>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      waitForHydration: () => hydrationPromise,

      currentRole: 'resident',
      staffId: null,
      profiles: {},

      setResident: () => set({ currentRole: 'resident' }),
      setBusiness: () => set({ currentRole: 'business' }),
      setStaff: (staffId) => set({ currentRole: 'staff', staffId }),

      getProfile: (role = get().currentRole) =>
        role ? get().profiles[role]?.data ?? null : null,

      setProfile: (role, data) => {
        const profiles = {
          ...get().profiles,
          [role]: { data, cachedAt: Date.now() },
        }
        // console.log('[RoleStore] setProfile()', { role, cachedAt: profiles[role]?.cachedAt })
        // if (role === 'resident') {
        //   debugResidentProfile('setProfile', data)
        // }
        set({ profiles })
      },

      ensureLoaded: async (role, opts) => {
        // console.log('[RoleStore] ensureLoaded() start', { role, opts })
        await get().waitForHydration()

        const entry = get().profiles[role]
        const force = !!opts?.force
        const stale = !entry || Date.now() - entry.cachedAt > MAX_AGE

        // console.log('[RoleStore] cache state:', {
        //   hasEntry: !!entry,
        //   cachedAt: entry?.cachedAt ?? null,
        //   ageMs: entry ? Date.now() - entry.cachedAt : null,
        //   stale,
        //   force,
        // })

        if (!force && !stale) {
          // console.log('[RoleStore] returning FRESH CACHED profile for', role)
          // if (role === 'resident') debugResidentProfile('return-cached', entry?.data)
          return entry?.data ?? null
        }

        try {
          if (role === 'resident') {
            console.log('[RoleStore] fetching resident via fetchResidentPlus() …')
            const payload = await fetchResidentPlus() // expected { details, is_staff, staff_id, is_bhw, has_maternal_record }
            console.log('[RoleStore] fetchResidentPlus() raw:', summarize(payload))

            const { details, is_staff, staff_id, is_bhw, has_maternal_record } = payload || {}
            console.log('[RoleStore] fetchResidentPlus() unpacked:', {
              hasDetails: !!details,
              is_staff,
              staff_id,
              is_bhw,
              has_maternal_record,
            })
            
            // Update staffId only if user is BHW
            if (is_bhw && staff_id) {
              if (get().staffId !== staff_id) {
                console.log('[RoleStore] updating staffId from resident payload:', staff_id)
                set({ staffId: staff_id })
              }
            } else if (staff_id && !is_bhw) {
              // Clear staffId if user has staff_id but is NOT BHW
              console.log('[RoleStore] User has staff_id but is NOT BHW (role_id != 9), clearing staffId')
              set({ staffId: null })
            }
            
            // Add is_bhw and has_maternal_record to details for downstream checks
            if (details) {
              details.is_bhw = is_bhw
              details.has_maternal_record = has_maternal_record
              debugResidentProfile('after-fetch', details)
              get().setProfile('resident', details)
            } else {
              console.warn('[RoleStore] fetchResidentPlus() returned NO details')
            }
            return details ?? entry?.data ?? null
          }

          if (role === 'staff') {
            // const details = await fetchStaffProfile()
            // if (details) get().setProfile('staff', details)
            console.log('[RoleStore] staff role requested; returning cached staff profile only')
            return get().profiles.staff?.data ?? null
          }

          // if (role === 'business') {
          //   // const details = await fetchBusinessProfile()
          //   // if (details) get().setProfile('business', details)
          //   console.log('[RoleStore] business role requested; returning cached business profile only')
          //   return get().profiles.business?.data ?? null
          // }

          if (role === 'business') {
            console.log('[RoleStore] fetching logged-in user as business owner via fetchResidentPlus() …')
            const payload = await fetchResidentPlus()
            const { details } = payload || {}

            if (details) {
              // store it under 'business' role so getProfile('business') works
              get().setProfile('business', details)
            } else {
              console.warn('[RoleStore] fetchResidentPlus() returned no details for business')
            }

            return details ?? entry?.data ?? null
          }

          return entry?.data ?? null
        } catch (e) {
          console.log('[RoleStore] ensureLoaded() fetch failed:', e)
          return entry?.data ?? null
        }
      },

      clearAll: () => {
        console.log('[RoleStore] clearAll() called — clearing cache & role')
        set({ currentRole: 'resident', staffId: null, profiles: {} })
      },
    }),
    {
      name: 'role-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => {
        // console.log('[RoleStore] onRehydrateStorage() BEFORE')
        return (state, error) => {
          if (error) {
            console.error('[RoleStore] rehydrate error:', error)
          } else {
            // console.log('[RoleStore] onRehydrateStorage() AFTER ok')
          }
          state?.hasHydrated === false && (state as any).set?.({ hasHydrated: true })
          // resolve the hydration gate
          try { resolveHydration?.() } catch {}
        }
      },
    }
  )
)
