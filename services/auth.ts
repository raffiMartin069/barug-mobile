// services/auth.ts
import { toE164PH } from '@/constants/phone';
import { supabase } from '@/constants/supabase';

/** Always normalize ONCE (send) and pass the exact value around */
export async function sendOtp(rawPhone: string) {
  const phone = toE164PH(rawPhone);
  if (!phone) throw new Error('Invalid phone number');

  console.log('[SEND OTP] phone:', phone);

  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms', shouldCreateUser: true }, // allow first-time users if desired
  });

  console.log('[SEND OTP] data:', data, 'error:', error);
  if (error) throw error;

  // Return the EXACT E.164 we used so the UI can pass it to /verify
  return phone;
}

/** Do NOT re-normalize here—use the EXACT string returned by sendOtp()  */
export async function verifyOtp(phoneE164: string, code: string) {
  const phone = String(phoneE164).trim().replace(/\s+/g, ''); // strip accidental spaces only

  // Optional: assert it still looks E.164
  if (!/^\+\d{9,15}$/.test(phone)) {
    throw new Error('Invalid phone for verification');
  }

  console.log('[VERIFY OTP] phone:', phone, 'code:', code);

  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: String(code).trim(),
    type: 'sms',                 // must be 'sms' for phone OTP
  });

  console.log('[VERIFY OTP] data:', data, 'error:', error);
  if (error) throw error;

  // Link your person AFTER verification succeeds
  const { error: linkErr } = await supabase.rpc('link_test_person_by_phone', { p_phone: phone });
  if (linkErr) throw linkErr;

  return data.session; // tokens if you need them
}

export async function logout() {
  await supabase.auth.signOut();
  // Note: Profile store should be cleared by the calling component
}
