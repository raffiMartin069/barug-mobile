import { supabase } from '../constants/supabase';

export async function setMPIN(pin: string) {
  const { data, error } = await supabase.rpc('set_mpin', { p_pin: pin });
  if (error) throw error;
  return data;
}

export async function verifyMPIN(pin: string) {
  const { data, error } = await supabase.rpc('verify_mpin', { p_pin: pin });
  if (error) throw error;
  return data as boolean;
}

export async function changeMPIN(oldPin: string, newPin: string) {
  const { data, error } = await supabase.rpc('change_mpin', { p_old: oldPin, p_new: newPin });
  if (error) throw error;
  return data;
}
