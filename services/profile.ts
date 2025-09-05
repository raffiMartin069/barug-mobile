import { supabase } from '../constants/supabase';

export async function getMyProfile() {
  const { data, error } = await supabase.rpc('me_profile');
  if (error) throw error;
  return data;
}

/** Returns: resident full details + is_staff + staff_id */
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

export async function updateMyProfile(updates: any) {
  // you can expose a Supabase RPC for updating instead of direct update
  const { data, error } = await supabase.from('person').update(updates).eq('supabase_uid', (await supabase.auth.getUser()).data.user?.id).select().single();
  if (error) throw error;
  return data;
}


// Valid ID
/* ---------- VALID ID HELPERS ---------- */

export type InsertValidIdParams = {
  /** INT PK of person (NOT the supabase auth uid) */
  personId: number
  /** INT FK to your lookup table (valid_id_type.id) */
  validIdTypeId: number
  selfiePath: string
  frontPath: string
  backPath: string
}

/**
 * Look up the numeric valid_id_type.id by a stable code you use in the app
 * (e.g. "ephil_id", "drivers_license", etc).
 * Adjust table/column names to match your schema.
 */
export async function getValidIdTypeIdByCode(code: string): Promise<number> {
  const { data, error } = await supabase
    .from('valid_id_type')
    .select('id')
    .eq('code', code)
    .limit(1)
    .single()

  if (error) throw error
  return data.id as number
}

/**
 * Call the Postgres function: insert_valid_id(
 *   p_person_id int,
 *   p_valid_id_type_id int,
 *   p_selfie_path text,
 *   p_valid_id_front text,
 *   p_valid_id_back text
 * )
 */
export async function insertValidId(params: InsertValidIdParams) {
  const { personId, validIdTypeId, selfiePath, frontPath, backPath } = params

  const { data, error } = await supabase.rpc('insert_valid_id', {
    p_person_id: personId,
    p_valid_id_type_id: validIdTypeId,
    p_selfie_path: selfiePath,
    p_valid_id_front: frontPath,
    p_valid_id_back: backPath,
  })

  if (error) throw error
  return data
}