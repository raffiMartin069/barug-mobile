import apiClient from './apiClient';

export const registerResidentWithVerification = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/v1/residents/register/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    console.error('Registration API error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Registration failed' };
  }
};
