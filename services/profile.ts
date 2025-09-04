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
