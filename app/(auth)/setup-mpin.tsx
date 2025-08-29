// app/(auth)/setup-mpin.tsx
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../constants/supabase'

export default function SetupMPIN() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)

  const onSave = async () => {
    if (!/^\d{4,6}$/.test(a)) return Alert.alert('MPIN must be 4–6 digits')
    if (a !== b) return Alert.alert('MPINs do not match')

    setBusy(true)
    try {
      const { error } = await supabase.rpc('set_mpin', { p_pin: a })
      if (error) return Alert.alert('Failed to set MPIN', error.message)
      router.replace('/(resident)/(tabs)/residenthome')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Set your MPIN</Text>
      <TextInput secureTextEntry keyboardType="number-pad" maxLength={6}
        value={a} onChangeText={setA} placeholder="Enter MPIN"
        style={{ borderWidth:1, borderRadius:10, padding:12 }} />
      <TextInput secureTextEntry keyboardType="number-pad" maxLength={6}
        value={b} onChangeText={setB} placeholder="Confirm MPIN"
        style={{ borderWidth:1, borderRadius:10, padding:12 }} />
      <TouchableOpacity onPress={onSave} disabled={busy}
        style={{ backgroundColor:'#111827', padding:14, borderRadius:10, opacity: busy ? .7 : 1 }}>
        {busy ? <ActivityIndicator color="#fff" /> :
          <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Save MPIN</Text>}
      </TouchableOpacity>
    </View>
  )
}
