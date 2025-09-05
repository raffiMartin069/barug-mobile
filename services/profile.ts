// services/profiling.ts
import { supabase } from '@/constants/supabase'

export async function getMyProfile() {
  const { data, error } = await supabase.rpc('me_profile')
  if (error) throw error
  return data
}

/** Returns: resident full details + is_staff + staff_id (for the *current* user) */
export async function fetchResidentPlus() {
  const me = await supabase.rpc('me_profile')
  if (me.error) throw me.error

  const personId = me.data?.person_id
  if (!personId) return { details: null, is_staff: false, staff_id: null }

  const res = await supabase.rpc('get_specific_resident_full_profile', { p_person_id: personId })
  if (res.error) throw res.error

  const details = Array.isArray(res.data) ? res.data[0] : res.data

  return {
    details,
    is_staff: Boolean(details?.is_staff),
    staff_id: details?.staff_id ?? null,
  }
}

/**
 * ✅ New: fetch a resident's full profile by an explicit person_id.
 * Uses the same RPC you already call above, just parameterized.
 * Useful for the Update Resident screen to prefill the fields after search.
 */
export async function fetchResidentPlusById(personId: number) {
  const res = await supabase.rpc('get_specific_resident_full_profile', { p_person_id: personId })
  if (res.error) throw res.error
  // your RPC sometimes returns an array — normalize to a single object
  return Array.isArray(res.data) ? res.data[0] : res.data
}


/** Exact payload shape expected by the `profile_resident` Postgres function */
export type ProfileResidentArgs = {
  p_performer_id: number

  p_last_name: string
  p_first_name: string
  p_middle_name: string | null
  p_suffix: string | null

  /** YYYY-MM-DD */
  p_birthdate: string

  p_email: string | null
  p_mobile_num: string

  p_residency_period: number
  p_occupation: string

  p_sex_id: number
  p_civil_status_id: number
  p_nationality_id: number
  p_religion_id: number
  p_education_id: number
  p_employment_status_id: number
  p_gov_mem_prog_id: number
  p_mnthly_personal_income_id: number

  p_street: string
  p_barangay: string
  p_city: string
  p_purok_sitio_name: string

  p_latitude: number | null
  p_longitude: number | null

  p_mother_person_id: number | null
  p_father_person_id: number | null
  p_guardian_person_ids: number[]
  p_child_person_ids: number[]

  p_is_business_owner: boolean
  p_is_email_verified: boolean
  p_is_id_valid: boolean
}

/** Create / profile a resident */
export async function profileResident(args: ProfileResidentArgs) {
  const { data, error } = await supabase.rpc('profile_resident', args)
  if (error) throw error
  return data
}

/* ============================================================
   UPDATE: maps exactly to your `update_person_info` RPC
   (Screenshots show only these fields are accepted.)
   ============================================================ */

export type UpdateResidentArgs = {
  /** Staff (editor) person id who performs the update */
  p_editor_staff_id: number

  /** Target resident (person) id being edited */
  p_person_id: number

  /** Reason/remarks for editing */
  p_reason: string

  // --- basic identity ---
  p_first_name: string
  p_middle_name: string | null
  p_last_name: string
  p_suffix: string | null

  /** YYYY-MM-DD */
  p_birthdate: string

  // --- lookups ---
  p_sex_id: number
  p_civil_status_id: number
  p_nationality_id: number
  p_religion_id: number

  // --- contacts & work ---
  p_email: string | null
  p_mobile_num: string
  p_occupation: string

  // --- socioeconomic ---
  p_mnthly_personal_income_id: number
  p_residential_status_id: number
  p_education_id: number
  p_employment_status_id: number
  p_gov_mem_prog_id: number
}

/** Update an existing resident (limited to the fields supported by update_person_info) */
export async function updateResident(args: UpdateResidentArgs) {
  const { data, error } = await supabase.rpc('update_person_info', args)
  if (error) throw error
  return data
}
