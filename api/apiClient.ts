// api/apiClient.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiClient = axios.create({
  baseURL: 'http://192.168.1.2:8000/api', // ✅ replace with your backend
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Attach token from AsyncStorage for every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('jwt_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.warn('Could not get token from AsyncStorage:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
