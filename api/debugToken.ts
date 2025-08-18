// api/authApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { setTokens, clearTokens } from './apiClient';

type User = { user_id: number; username: string; role: string };
type Staff = { staff_id: number; username: string; role: 'BHW' };

export const loginUser = async (email: string, password: string) => {
  try {
    const res = await apiClient.post(
      '/auth/login/',
      { username: email, password },
      { headers: { 'X-Platform': 'mobile' } } // redundant but explicit
    );

    // Expect: { message, user, token, refresh }
    const { token, refresh, user } = res.data || {};
    if (!token || !refresh || !user) {
      throw new Error('Invalid login response');
    }

    await setTokens(token, refresh);
    // (Optional) also keep user in storage
    // DEV ONLY: verify they exist
    const [a, r] = await Promise.all([
      AsyncStorage.getItem('jwt_access'),
      AsyncStorage.getItem('jwt_refresh'),
    ]);
    console.log('jwt_access length:', a?.length, 'jwt_refresh length:', r?.length);
    // Or mask them:
    const mask = (s?: string | null) => s ? s.slice(0, 12) + '...' + s.slice(-8) : s;
    console.log('jwt_access:', mask(a), 'jwt_refresh:', mask(r));

    await AsyncStorage.setItem('current_user', JSON.stringify(user));

    return { token, refresh, user as User };
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Login failed' };
  }
};

export const loginBhw = async (username: string, password: string) => {
  try {
    const res = await apiClient.post(
      '/auth/bhw-field-login/',
      { username, password },
      { headers: { 'X-Platform': 'mobile' } }
    );
    // Expect: { message, staff: {...}, token, refresh }
    const { token, refresh, staff } = res.data || {};
    if (!token || !refresh || !staff) {
      throw new Error('Invalid BHW login response');
    }

    await setTokens(token, refresh);
    await AsyncStorage.setItem('bhw_staff', JSON.stringify(staff));

    return staff as Staff;
  } catch (error: any) {
    console.error('BHW login error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'BHW login failed' };
  }
};

export const logout = async () => {
  try {
    await apiClient.post('/auth/logout/'); // server clears cookies; mobile just a no-op
  } catch {
    // ignore
  } finally {
    await clearTokens();
    await AsyncStorage.multiRemove(['current_user', 'bhw_staff']);
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/resend-verification/', { email });
    return response.data;
  } catch (error: any) {
    console.error('Resend error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Resend failed' };
  }
};

export const requestPasswordReset = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/forgot-password/', { email });
    return response.data;
  } catch (error: any) {
    console.error('Reset error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Reset request failed' };
  }
};
