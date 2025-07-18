import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://192.168.1.3:8000/api', // 👈 Your backend URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
