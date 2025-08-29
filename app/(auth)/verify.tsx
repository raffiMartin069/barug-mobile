// app/(auth)/verify.tsx
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../constants/supabase'

const RESEND_SECONDS = 30

export default function Verify() {
  const params = useLocalSearchParams<{ phone: string | string[] }>()
  const phone = useMemo(() => Array.isArray(params.phone) ? params.phone[0] : params.phone, [params.phone])

  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [resendIn, setResendIn] = useState(RESEND_SECONDS)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setResendIn(s => s > 0 ? s - 1 : 0), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const verify = async () => {
    if (busy) return
    if (!/^\d{6}$/.test(code.trim())) return Alert.alert('Invalid code', 'Enter the 6-digit code.')
    setBusy(true)
    try {
      const { error: otpErr } = await supabase.auth.verifyOtp({ phone: String(phone), token: code.trim(), type: 'sms' })
      if (otpErr) { Alert.alert('Invalid / expired code', otpErr.message); return }

      // Link by phone (choose your PH/US linker)
      const digits = String(phone).replace(/\D/g, '')
      const linker = (digits.startsWith('+63') || digits.startsWith('9') || digits.startsWith('09'))
        ? 'link_test_person_by_phone' : 'link_test_person_by_temp_number'
      const { error: linkErr } = await supabase.rpc(linker, { p_phone: phone })
      if (linkErr) { Alert.alert('Account not found', linkErr.message); return }

      // Decide next
      const { data: me, error: meErr } = await supabase.rpc('me_profile')
      if (meErr) { Alert.alert('Error', meErr.message); return }
      if (!me?.mpin_set) router.replace('/(auth)/setup-mpin')
      else router.replace('/(resident)/(tabs)/residenthome')  // session exists; next cold start will ask MPIN
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    if (!phone || resendIn > 0) return
    await supabase.auth.signInWithOtp({ phone: String(phone), options: { channel: 'sms' } })
    setResendIn(RESEND_SECONDS)
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 18 }}>Enter the code sent to {phone}</Text>
      <TextInput keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode}
        style={{ borderWidth:1, borderRadius:10, padding:12, letterSpacing:8, textAlign:'center' }} />
      <TouchableOpacity onPress={verify} disabled={busy}
        style={{ backgroundColor:'#111827', padding:14, borderRadius:10, opacity: busy ? .7 : 1 }}>
        {busy ? <ActivityIndicator color="#fff" /> :
          <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Verify & Continue</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={resend} disabled={resendIn > 0} style={{ padding: 14 }}>
        <Text style={{ textAlign:'center' }}>{resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}</Text>
      </TouchableOpacity>
    </View>
  )
}
