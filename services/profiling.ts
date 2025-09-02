// services/profiling.ts
import { supabase } from '@/constants/supabase'

/** Exact payload shape expected by the `profile_resident` Postgres function */
export type ProfileResidentArgs = {
  p_performer_id: number

  p_last_name: string
  p_first_name: string
  p_middle_name: string | null
  p_suffix: string | null

  /** YYYY-MM-DD */
  p_birthdate: string

  p_email: string
  p_mobile_num: string

  p_residency_period: number

  p_sex_id: number                 // 1 = male, 2 = female (match your lookup)
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
  p_guardian_person_ids: number[]     // empty array if none
  p_child_person_ids: number[]        // empty array if none

  p_is_business_owner: boolean
  p_is_email_verified: boolean
  p_is_id_valid: boolean
}

/** Minimal helper to invoke the RPC with proper types */
export async function profileResident(args: ProfileResidentArgs) {
  const { data, error } = await supabase.rpc('profile_resident', args)
  if (error) throw error
  return data
}