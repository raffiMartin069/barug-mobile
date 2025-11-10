// services/profiling.ts
import { supabase } from '@/constants/supabase'

/**
 * Exact payload shape expected by the `profile_resident` Postgres function.
 * Updated to match Supabase UI:
 * - NEW: p_is_student (boolean)
 * - NEW: p_gov_mem_prog_ids (integer[])
 * - Legacy: p_gov_mem_prog_id? (single) — will be converted to the array internally
 */
export type ProfileResidentArgs = {
  p_performer_id: number

  p_last_name: string
  p_first_name: string
  p_middle_name: string | null
  p_suffix: string | null

  /** YYYY-MM-DD (DB type: date) */
  p_birthdate: string

  /** DB type: text (nullable) */
  p_email: string | null

  /** DB type: text (not null per your UI validation) */
  p_mobile_num: string

  /** DB type: integer */
  p_residency_period: number

  /** DB type: text */
  p_occupation: string

  /** Lookup integer IDs */
  p_sex_id: number
  p_civil_status_id: number
  p_nationality_id: number
  p_religion_id: number
  p_education_id: number
  p_employment_status_id: number

  /** NEW preferred field: integer[] of program IDs */
  p_gov_mem_prog_ids: number[]

  /** Legacy single program ID (optional). If present and array is empty, we will convert it. */
  p_gov_mem_prog_id?: number

  p_mnthly_personal_income_id: number

  /** Address text fields */
  // p_street: string
  // p_barangay: string
  // p_city: string
  // p_purok_sitio_name: string

  // /** DB type: numeric (nullable) */
  // p_latitude: number | null
  // p_longitude: number | null

  /** DB type: integer (nullable) */
  p_mother_person_id: number | null
  p_father_person_id: number | null

  /** DB type: integer[] (empty array if none) */
  p_guardian_person_ids: number[]
  p_child_person_ids: number[]

  /** Flags */
  p_is_business_owner: boolean
  p_is_email_verified: boolean
  p_is_id_valid: boolean

  /** NEW: DB type: boolean */
  p_is_student: boolean
}

/** Utility: force integer array semantics (["12","x",13] -> [12,13]) */
function toIntArray(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map(v => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : Number(v)))
    .filter(n => Number.isFinite(n)) as number[]
}

/** Utility: normalize possibly-undefined to null (for nullable DB args) */
const toNull = <T>(v: T | null | undefined): T | null => (v === undefined ? null : v)

/** Utility: coerce boolean-ish values */
const toBool = (v: unknown): boolean => Boolean(v)

/**
 * Call the RPC with strong runtime normalization:
 * - Coerces guardian/child arrays to number[]
 * - Coerces possibly undefined optional fields to null
 * - Guarantees p_gov_mem_prog_ids is the source of truth (uses legacy single ID if needed)
 */
export async function profileResident(args: ProfileResidentArgs) {
  // Determine the final program IDs array
  const finalProgIds =
    (Array.isArray(args.p_gov_mem_prog_ids) && args.p_gov_mem_prog_ids.length > 0)
      ? toIntArray(args.p_gov_mem_prog_ids)
      : (typeof args.p_gov_mem_prog_id === 'number'
          ? [args.p_gov_mem_prog_id]
          : [])

  const payload = {
    ...args,
    // Nullable scalars: use null instead of undefined
    p_email: toNull(args.p_email),
    p_middle_name: toNull(args.p_middle_name),
    p_suffix: toNull(args.p_suffix),
    p_mother_person_id: toNull(args.p_mother_person_id),
    p_father_person_id: toNull(args.p_father_person_id),

    // Arrays MUST be integer[] for Postgres function
    p_guardian_person_ids: toIntArray(args.p_guardian_person_ids),
    p_child_person_ids: toIntArray(args.p_child_person_ids),

    // NEW: always provide the array field expected by the RPC
    p_gov_mem_prog_ids: finalProgIds,

    // Booleans
    p_is_business_owner: toBool(args.p_is_business_owner),
    p_is_email_verified: toBool(args.p_is_email_verified),
    p_is_id_valid: toBool(args.p_is_id_valid),
    p_is_student: toBool(args.p_is_student),
  }

  // We intentionally do NOT send the legacy single ID to RPC
  delete (payload as any).p_gov_mem_prog_id

  const { data, error } = await supabase.rpc('profile_resident', payload)
  if (error) throw error
  return data
}
