// api/authApi.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from './apiClient';

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login/', {
      username: email,
      password,
    });

    const { token, user } = response.data;

    // ✅ Save JWT token in AsyncStorage
    await AsyncStorage.setItem('jwt_token', token);

    return { token, user };
  } catch (error: any) {
    console.error('Login error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Login failed' };
  }
};


export const loginBhw = async (username: string, password: string) => {
  try {
    const res = await apiClient.post('/auth/bhw-field-login/', {
      username,
      password,
    });
    const { staff_id } = res.data || {};
    if (!staff_id) throw { message: 'Invalid credentials' };

    // optional: keep for later use
    await AsyncStorage.setItem('bhw_staff_id', String(staff_id));

    return staff_id;
  } catch (error: any) {
    console.error('BHW login error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'BHW login failed' };
  }
};

// export const loginUser = async (email: string, password: string) => {
//   try {
//     const response = await apiClient.post('/auth/login/', {
//       username: email,
//       password,
//     });
//     return response.data; // assuming backend returns { token, user }
//   } catch (error: any) {
//     // console.error('Login error:', error.response?.data || error.message);
//     throw error.response?.data || { message: 'Login failed' };
//   }
// };


export const resendVerificationEmail = async (email: string) => {
  try {
    const response = await apiClient.post("/auth/resend-verification/", { 
      email 
    });
    return response.data; 
  } catch (error: any) {
    console.error("Resend error:", error.response?.data || error.message);
    throw error.response?.data || { message: "Resend failed" };
  } 
};


export const requestPasswordReset = async (email: string) => {
  try {
    const response = await apiClient.post('/auth/forgot-password/', {
      email,
    });
    return response.data;
  } catch (error: any) {
    console.error('Request Password Reset error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Reset request failed' };
  }
};