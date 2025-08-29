import { toE164PH } from '../constants/phone';
import { supabase } from '../constants/supabase';

export async function sendOtp(rawPhone: string) {
  const phone = toE164PH(rawPhone);
  if (!phone) throw new Error('Invalid phone number');
  const { error } = await supabase.auth.signInWithOtp({ phone, options: { channel: 'sms' } });
  if (error) throw error;
  return phone;
}

export async function verifyOtp(phone: string, code: string) {
  const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
  if (error) throw error;

  // one-time link (idempotent)
  await supabase.rpc('link_test_person_by_phone', { p_phone: phone });

  return data.session; // contains access + refresh token
}

export async function logout() {
  await supabase.auth.signOut();
}
