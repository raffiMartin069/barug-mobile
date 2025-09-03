import { supabase } from '../constants/supabase';

export async function getMyProfile() {
  const { data, error } = await supabase.rpc('me_profile');
  if (error) throw error;
  return data;
}

export async function updateMyProfile(updates: any) {
  // you can expose a Supabase RPC for updating instead of direct update
  const { data, error } = await supabase.from('person').update(updates).eq('supabase_uid', (await supabase.auth.getUser()).data.user?.id).select().single();
  if (error) throw error;
  return data;
}
