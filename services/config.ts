// services/config.ts
import Constants from 'expo-constants';

// Prefer EXPO_PUBLIC_* at runtime
const env = (Constants?.expoConfig?.extra ?? {}) as Record<string, any>;

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (env.EXPO_PUBLIC_API_BASE_URL as string) ||
  '';
