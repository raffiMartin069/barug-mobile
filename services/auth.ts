// services/auth.ts
import { toE164PH } from '@/constants/phone'
import { supabase } from '@/constants/supabase'

/** Send OTP via SMS */
export async function sendOtp(rawPhone: string) {
  const phone = toE164PH(rawPhone)
  if (!phone) throw new Error('Invalid phone number')

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: { channel: 'sms' },
  })
  if (error) throw error
  return phone
}

/** Verify OTP, then link the auth user to your person record */
export async function verifyOtp(rawPhone: string, code: string) {
  const phone = toE164PH(rawPhone) ?? rawPhone // tolerate pre-normalized input
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token: code,
    type: 'sms',
  })
  if (error) throw error

  // Choose the correct linker, mirroring your original verify.tsx logic
  const digits = String(phone).replace(/\D/g, '')
  const linker =
    digits.startsWith('63') || digits.startsWith('09') || digits.startsWith('9')
      ? 'link_test_person_by_phone'
      : 'link_test_person_by_temp_number'

  const { error: linkErr } = await supabase.rpc(linker, { p_phone: phone })
  if (linkErr) throw linkErr

  return data.session // access + refresh tokens if needed
}

export async function logout() {
  await supabase.auth.signOut()
}
