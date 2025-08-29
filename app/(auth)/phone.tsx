// app/(auth)/phone.tsx
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../constants/supabase'

function toE164PH(input: string) {
  let d = (input || '').replace(/\D/g, '')
  if (d.startsWith('09')) d = '63' + d.slice(1)
  if (/^9\d{9}$/.test(d)) d = '63' + d
  if (/^63\d{10}$/.test(d)) return '+' + d
  return null
}

export default function Phone() {
  const [raw, setRaw] = useState('')
  const [loading, setLoading] = useState(false)

  const checkPhoneExists = async (phone: string) => {
    const { data, error } = await supabase.rpc('phone_exists', { p_phone: phone })
    if (error) throw error
    return !!data
  }

  const sendOtp = async () => {
    if (loading) return
    setLoading(true)
    try {
      let phone = raw.trim()
      const ph = toE164PH(phone)
      if (ph) phone = ph
      if (!phone) {
        Alert.alert('Invalid number', 'Use 09XXXXXXXXX / +639XXXXXXXXX / E.164')
        return
      }

      // ✅ DB existence check
      const exists = await checkPhoneExists(phone)
      if (!exists) {
        Alert.alert(
          'Number not found',
          'This mobile number is not registered. Please register first or contact your barangay office.'
        )
        return
      }

      // ✅ Send OTP only if phone exists
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: 'sms' },
      })
      if (error) {
        Alert.alert('Failed to send code', error.message)
        return
      }

      router.push({ pathname: '/(auth)/verify', params: { phone } })
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: '600' }}>Sign in with mobile</Text>
      <TextInput
        placeholder="09XXXXXXXXX / +639XXXXXXXXX"
        keyboardType="phone-pad"
        autoCapitalize="none"
        value={raw}
        onChangeText={setRaw}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
      />
      <TouchableOpacity
        onPress={sendOtp}
        disabled={loading}
        style={{ backgroundColor: '#111827', padding: 14, borderRadius: 10, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Send OTP</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
