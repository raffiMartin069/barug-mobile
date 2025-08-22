// api/apiClient.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

// --- CONFIG ---
const BASE_URL = 'http://10.184.82.83:8000/api';

// Keys for storage
const ACCESS_KEY = 'jwt_access';
const REFRESH_KEY = 'jwt_refresh';

// Bare axios (no interceptors) to call /auth/refresh so we don't recurse
const bareAxios = axios.create({ baseURL: BASE_URL, timeout: 20000 });

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

// Small helpers
export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_KEY);
}
export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH_KEY);
}
export async function setTokens(access: string, refresh: string) {
  await AsyncStorage.multiSet([[ACCESS_KEY, access], [REFRESH_KEY, refresh]]);
}
export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

// Detect RN FormData (some environments break instanceof)
const looksLikeFormData = (data: any) =>
  data &&
  typeof data === 'object' &&
  typeof (data as any).append === 'function' &&
  ('_parts' in data || 'getParts' in data);

// -------- REQUEST INTERCEPTOR --------
apiClient.interceptors.request.use(
  async (config) => {
    // Identify as mobile so the backend returns tokens in the body on login/refresh
    (config.headers as any)['X-Platform'] = 'mobile';

    const access = await getAccessToken();
    if (access) {
      (config.headers as any).Authorization = `Bearer ${access}`;
    }

    // If sending FormData, ensure proper header and prevent transforms
    if (looksLikeFormData(config.data)) {
      (config.headers as any)['Content-Type'] = 'multipart/form-data';
      config.transformRequest = [(data) => data];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Single-flight refresh to avoid multiple parallel refresh calls
let refreshPromise: Promise<{ access: string; refresh: string }> | null = null;

// Call /auth/refresh/ using refresh token (from storage)
async function refreshTokens(): Promise<{ access: string; refresh: string }> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = await getRefreshToken();
      if (!refresh) throw new Error('No refresh token');

      // POST body (mobile style)
      const { data } = await bareAxios.post('/auth/refresh/', { refresh }, {
        headers: { 'X-Platform': 'mobile' },
      });

      // Expect { token, refresh }
      const newAccess = data?.token;
      const newRefresh = data?.refresh;
      if (!newAccess || !newRefresh) {
        throw new Error('Invalid refresh response');
      }

      await setTokens(newAccess, newRefresh);
      return { access: newAccess, refresh: newRefresh };
    })();

    // After it settles, reset the promise so next 401 can trigger a new refresh
    refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// Utility: is this request itself a login/refresh to avoid loops?
function isAuthEndpoint(config?: AxiosRequestConfig) {
  const url = (config?.url || '').toLowerCase();
  return url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
}

// -------- RESPONSE INTERCEPTOR (401 -> refresh -> retry once) --------
apiClient.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean });

    // If not 401, or already retried, or auth endpoint => just fail
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      isAuthEndpoint(original)
    ) {
      return Promise.reject(error);
    }

    try {
      original._retry = true;

      const { access } = await refreshTokens();

      // Update header and retry
      original.headers = original.headers || {};
      (original.headers as any).Authorization = `Bearer ${access}`;

      return apiClient(original);
    } catch (e) {
      // Refresh failed => clean up and bubble up
      await clearTokens();
      return Promise.reject(error);
    }
  }
);

export default apiClient;
