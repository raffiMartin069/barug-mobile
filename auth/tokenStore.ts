// auth/tokenStore.ts
import * as SecureStore from 'expo-secure-store';

type Tokens = { accessToken: string | null; refreshToken: string | null }

let inMemory: Tokens = { accessToken: null, refreshToken: null }
let loaded = false

export async function loadTokens() {
  if (loaded) return inMemory
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync('access_token'),
    SecureStore.getItemAsync('refresh_token'),
  ])
  inMemory = { accessToken: accessToken || null, refreshToken: refreshToken || null }
  loaded = true
  return inMemory
}

export function getAccessTokenSync() {
  return inMemory.accessToken
}

export async function setTokens(tokens: Tokens) {
  inMemory = tokens
  await Promise.all([
    tokens.accessToken
      ? SecureStore.setItemAsync('access_token', tokens.accessToken)
      : SecureStore.deleteItemAsync('access_token'),
    tokens.refreshToken
      ? SecureStore.setItemAsync('refresh_token', tokens.refreshToken)
      : SecureStore.deleteItemAsync('refresh_token'),
  ])
}

export async function clearTokens() {
  await setTokens({ accessToken: null, refreshToken: null })
}
