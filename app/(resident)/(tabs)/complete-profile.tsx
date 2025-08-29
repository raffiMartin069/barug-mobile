import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';

export default function CompleteProfile() {
  // TODO: gather fields, call your RPC to complete profile
  return (
    <View style={{ padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Complete your profile</Text>
      <TouchableOpacity onPress={() => router.replace('/(resident)/(tabs)/residenthome')}
        style={{ backgroundColor:'#111827', padding:14, borderRadius:10 }}>
        <Text style={{ color:'#fff', textAlign:'center', fontWeight:'600' }}>Done (mock)</Text>
      </TouchableOpacity>
    </View>
  );
}
