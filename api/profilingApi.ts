import apiClient from './apiClient';

export const registerResidentWithVerification = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/v1/residents/register/', formData, {

    });
    return response.data;
  } catch (error: any) {
    console.error('Registration API error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Registration failed' };
  }
};

export const registerResidentWithVerificationBHW = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/v1/residents/register-bhw/', formData, {

    });
    return response.data;
  } catch (error: any) {
    console.error('Registration API error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Registration failed' };
  }
};


export const requestPersonVerification = async (formData: FormData) => {
  try {
    const res = await apiClient.post('/v1/residents/verify/', formData);
    return res.data;
  } catch (error: any) {
    console.error('Verification API error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Response error:', error.response);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    throw error.response?.data || { message: 'Verification failed' };
  }
};