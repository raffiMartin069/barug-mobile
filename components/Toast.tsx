import { Alert, Platform, ToastAndroid } from 'react-native'

export function showToast(message: string) {
  try {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT)
    } else {
      // iOS fallback: use alert as a lightweight fallback when no toast library is available.
      // Keep message simple — Alert is modal but acceptable as a fallback.
      Alert.alert(message)
    }
  } catch (e) {
    // swallow errors to avoid crashing callers
    console.warn('showToast failed', e)
  }
}

export default showToast
