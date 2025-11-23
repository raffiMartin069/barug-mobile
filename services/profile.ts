// services/profile.ts
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
  if (!personId) return { details: null, is_staff: false, staff_id: null, is_bhw: false, has_maternal_record: false }

  // Get person status and residential status
  const { data: personData, error: personError } = await supabase
    .from('person')
    .select('person_status_id, residential_status_id')
    .eq('person_id', personId)
    .single()
  
  if (personError) throw personError

  const res = await supabase.rpc('get_specific_resident_full_profile', { p_person_id: personId })
  if (res.error) throw res.error

  const details = Array.isArray(res.data) ? res.data[0] : res.data
  
  // Add person status info to details
  if (details) {
    details.person_status_id = personData.person_status_id
    details.person_status_name = personData.person_status_id === 1 ? 'ACTIVE' : personData.person_status_id === 2 ? 'INACTIVE' : personData.person_status_id === 3 ? 'DECEASED' : 'UNKNOWN'
    details.residential_status_id = personData.residential_status_id
  }
  
  console.log('[fetchResidentPlus] Checking staff status:', {
    is_staff: details?.is_staff,
    staff_id: details?.staff_id,
  })
  
  // Check if staff has role_id = 9 (Barangay Health Worker)
  let is_bhw = false
  if (details?.staff_id) {
    console.log('[fetchResidentPlus] Querying staff table: SELECT * FROM staff WHERE staff_id =', details.staff_id, 'AND role_id = 9')
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('staff_id', details.staff_id)
      .eq('role_id', 9)
      .maybeSingle()
    
    console.log('[fetchResidentPlus] Staff query result:', {
      found: !!data,
      data: data,
      error: error,
    })
    
    is_bhw = !!data
    console.log('[fetchResidentPlus] Is Barangay Health Worker (role_id=9)?', is_bhw)
  } else {
    console.log('[fetchResidentPlus] No staff_id found - cannot check for BHW role')
  }
  
  // Check if person has maternal health record
  let has_maternal_record = false
  if (personId) {
    console.log('[fetchResidentPlus] Checking maternal_health_record for person_id:', personId)
    const { data: maternalData, error: maternalError } = await supabase
      .from('maternal_health_record')
      .select('maternal_record_id')
      .eq('person_id', personId)
      .maybeSingle()
    
    if (maternalError) {
      console.log('[fetchResidentPlus] Maternal record query error:', maternalError)
    }
    
    has_maternal_record = !!maternalData
    console.log('[fetchResidentPlus] Has maternal record?', has_maternal_record, 'data:', maternalData)
  }

  const result = {
    details,
    is_staff: Boolean(details?.is_staff),
    staff_id: details?.staff_id ?? null,
    is_bhw,
    has_maternal_record,
  }
  
  console.log('[fetchResidentPlus] Final result:', {
    has_details: !!result.details,
    is_staff: result.is_staff,
    staff_id: result.staff_id,
    is_bhw: result.is_bhw,
    has_maternal_record: result.has_maternal_record,
  })
  
  return result
}

/** Fetch a resident's full profile by explicit person_id. */
export async function fetchResidentPlusById(personId: number) {
  const res = await supabase.rpc('get_specific_resident_full_profile', { p_person_id: personId })
  if (res.error) throw res.error
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
   UPDATE: updated to your new `update_person_info` RPC
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

  /** ✅ NEW */
  p_is_student: boolean

  /** ✅ NEW: multi-select govt programs
   *  - []   = clear all
   *  - null = no change
   *  - [n]  = set list
   */
  p_gov_mem_prog_ids: number[] | null
}

/** Update an existing resident */
export async function updateResident(args: UpdateResidentArgs) {
  const payload = {
    ...args,
    // keep empty array if caller wants to CLEAR; otherwise null is "no change"
    p_gov_mem_prog_ids:
      args.p_gov_mem_prog_ids?.length === 0
        ? []
        : args.p_gov_mem_prog_ids ?? null,
  }
  const { data, error } = await supabase.rpc('update_person_info', payload)
  if (error) throw error
  return data
}

// ------------------ Relations (unchanged) ------------------

function coerceNullable(v: number | 0 | null | undefined) {
  if (v === 0) return 0
  if (v == null) return null
  return v
}
function emptyToNull<T>(arr: T[] | null | undefined) {
  return arr && arr.length ? arr : null
}

export type UpdateRelationsArgs = {
  p_performed_by: number
  p_person_id: number
  p_reason: string
  p_mother_id: number | 0 | null
  p_father_id: number | 0 | null
  p_guardian_id: number | 0 | null
  p_children_add: number[] | null
  p_children_remove: number[] | null
}

export async function updatePersonRelations(args: UpdateRelationsArgs) {
  const payload = {
    p_performed_by: args.p_performed_by,
    p_person_id: args.p_person_id,
    p_reason: args.p_reason?.trim() ?? '',
    p_mother_id: coerceNullable(args.p_mother_id),
    p_father_id: coerceNullable(args.p_father_id),
    p_guardian_id: coerceNullable(args.p_guardian_id),
    p_children_add: emptyToNull(args.p_children_add),
    p_children_remove: emptyToNull(args.p_children_remove),
  } as const

  const { data, error } = await supabase.rpc('update_person_relations', payload)
  if (error) throw error
  return data
}
