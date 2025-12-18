import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE as string;

function runningInExpoGo(): boolean {
  // In SDK 53+, remote push isn’t supported in Expo Go
  return Constants.executionEnvironment === 'storeClient';
}

export async function getExpoPushToken(): Promise<string | null> {
  // gracefully skip in Expo Go
  if (runningInExpoGo()) {
    console.log('[PUSH] Skipping remote push token: running in Expo Go (SDK 53). Use a dev build.');
    return null;
  }

  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    status = res.status;
  }
  if (status !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data; // 'ExponentPushToken[...]'
}

export async function registerMyDevice(params: {
  user_type_id: 1 | 2;
  person_id?: number | null;
  staff_id?: number | null;
}) {
  const token = await getExpoPushToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/api/push/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_type_id: params.user_type_id,
        person_id: params.person_id ?? null,
        staff_id: params.staff_id ?? null,
        platform: Platform.OS,
        expo_push_token: token,
      }),
    });
    return res.ok;
  } catch (e) {
    console.log('[PUSH] register error', e);
    return false;
  }
}
