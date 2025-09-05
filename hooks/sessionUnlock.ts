// hooks/sessionUnlock.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
export const UNLOCKED_SESSION = 'unlocked_session'

export async function isUnlocked() {
  return !!(await AsyncStorage.getItem(UNLOCKED_SESSION))
}
export async function markUnlocked() {
  await AsyncStorage.setItem(UNLOCKED_SESSION, '1')
}
export async function resetUnlocked() {
  await AsyncStorage.removeItem(UNLOCKED_SESSION)
}
