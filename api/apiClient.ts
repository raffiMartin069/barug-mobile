import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://192.168.1.6:8000/api',
  timeout: 20000,
});

// Helper to detect RN FormData (some environments break instanceof)
const looksLikeFormData = (data: any) =>
  data &&
  typeof data === 'object' &&
  typeof (data as any).append === 'function' &&
  ('_parts' in data || 'getParts' in data);

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        (config.headers as any).Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Could not get token from AsyncStorage:', err);
    }

    // If we’re sending FormData, ensure multipart header
    if (looksLikeFormData(config.data)) {
      // Some setups default to x-www-form-urlencoded; override it
      (config.headers as any)['Content-Type'] = 'multipart/form-data';
      // Also make sure no transform tries to serialize it
      config.transformRequest = [(data) => data];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
