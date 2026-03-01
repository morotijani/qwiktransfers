import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Update this to your computer's local IP address or Ngrok URL for mobile testing
// Example: 'http://192.168.1.10:5000/api' or 'https://your-ngrok.ngrok-free.app/api'
// const API_URL = 'http://localhost:5000/api';
const API_URL = 'http://192.168.210.98:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Add timeout for better error handling on mobile
});

api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
