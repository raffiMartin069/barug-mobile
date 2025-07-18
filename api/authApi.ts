// api/authApi.ts
import apiClient from './apiClient';

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login/', {
      username: email,
      password,
    });
    return response.data; // assuming backend returns { token, user }
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Login failed' };
  }
};
