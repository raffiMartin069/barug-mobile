// app/(auth)/enter-mpin.tsx
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../constants/supabase'

export default function EnterMPIN() {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)

  const onUnlock = async () => {
    if (!/^\d{4,6}$/.test(pin)) return Alert.alert('Enter your 4–6 digit MPIN')
    setBusy(true)
    try {
      const { data, error } = await supabase.rpc('verify_mpin', { p_pin: pin })
      if (error) return Alert.alert('Unlock failed', error.message)
      if (!data) return Alert.alert('Incorrect MPIN')
      router.replace('/(resident)/(tabs)/residenthome')
    } finally {
      setBusy(false)
    }
  }

  const forgot = async () => {
    // End session → force OTP re-auth, then allow resetting MPIN
    await supabase.auth.signOut()
    router.replace('/(auth)/phone')
  }

  const goToLogin = () => {
    // Just navigate to phone login, without touching current session
    router.replace('/(auth)/phone')
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Enter MPIN</Text>
      <TextInput
        secureTextEntry
        keyboardType="number-pad"
        maxLength={6}
        value={pin}
        onChangeText={setPin}
        style={{ borderWidth: 1, borderRadius: 10, padding: 12, letterSpacing: 8, textAlign: 'center' }}
      />
      <TouchableOpacity
        onPress={onUnlock}
        disabled={busy}
        style={{ backgroundColor: '#111827', padding: 14, borderRadius: 10, opacity: busy ? 0.7 : 1 }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Unlock</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={forgot} style={{ padding: 14 }}>
        <Text style={{ textAlign: 'center' }}>Forgot MPIN? Use OTP</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goToLogin} style={{ padding: 14 }}>
        <Text style={{ textAlign: 'center' }}>Go to Login</Text>
      </TouchableOpacity>
    </View>
  )
}
