import axios from 'axios';

// const API_URL = 'http://44.197.38.121:8000/api';
//const API_URL = 'http://localhost:8000/api';
const API_URL = 'https://api.biogenetic.com.co/api';


const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance; 