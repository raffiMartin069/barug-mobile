import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { verifyMPIN } from '../../services/mpin';

export default function Unlock() {
  const [pin, setPin] = useState('');

  const onUnlock = async () => {
    try {
      const ok = await verifyMPIN(pin);
      if (!ok) return Alert.alert('Incorrect MPIN');
      router.replace('/residenthome');
    } catch (e: any) {
      Alert.alert('Unlock failed', e.message ?? String(e));
    }
  };

  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Enter MPIN</Text>
      <TextInput secureTextEntry keyboardType="number-pad" maxLength={6} value={pin} onChangeText={setPin}
        style={{ borderWidth:1, borderRadius:10, padding:12, letterSpacing:8, textAlign:'center' }} />
      <TouchableOpacity onPress={onUnlock} style={{ backgroundColor:'#111827', padding:14, borderRadius:10 }}>
        <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Unlock</Text>
      </TouchableOpacity>
    </View>
  );
}
