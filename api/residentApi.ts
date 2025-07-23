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
