import apiClient from './apiClient';

export const fetchResidentProfile = async () => {
  try {
    const response = await apiClient.get('/v1/residents/profile/');
    return response.data; // profile JSON
  } catch (error: any) {
    console.error('Fetch resident profile error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to fetch profile' };
  }
};


export const updateUnverifiedBasicInfo = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/v1/residents/unverified/update/', formData);
    return response.data; // response with message and result
  } catch (error: any) {
    console.error('Unverified update error:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Failed to update unverified info' };
  }
};
