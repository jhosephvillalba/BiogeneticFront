import axios from 'axios';
import { config as appConfig } from '../config/environment';

// Configuración de API desde environment
const API_URL = appConfig.API_URL;

// Configuración robusta de axios
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: appConfig.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función para retry automático
const retryRequest = async (error) => {
  const { config } = error;
  
  if (!config || !config.retry) {
    return Promise.reject(error);
  }
  
  config.retryCount = config.retryCount || 0;
  
  if (config.retryCount >= config.retry) {
    return Promise.reject(error);
  }
  
  config.retryCount++;
  
  // Esperar antes del retry (backoff exponencial)
  const delay = Math.pow(2, config.retryCount) * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  
  return axiosInstance(config);
};

// Interceptor para añadir el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Configurar retry por defecto
    if (config.retry === undefined) {
      config.retry = appConfig.RETRY_ATTEMPTS; // Intentos desde configuración
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response con manejo robusto de errores
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Si es error de red o timeout, intentar retry
    if (!error.response && originalRequest.retryCount < originalRequest.retry) {
      return retryRequest(error);
    }
    
    // Si es error 401 (no autorizado)
    if (error.response?.status === 401) {
      // Limpiar datos de sesión
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      
      // Redirigir a login si no estamos ya ahí
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error('Sesión expirada. Por favor, inicie sesión nuevamente.'));
    }
    
    // Si es error 403 (prohibido)
    if (error.response?.status === 403) {
      return Promise.reject(new Error('No tiene permisos para realizar esta acción.'));
    }
    
    // Si es error 404 (no encontrado)
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Recurso no encontrado.'));
    }
    
    // Si es error 500 (servidor)
    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Error interno del servidor. Intente más tarde.'));
    }
    
    // Si es error de red
    if (!error.response) {
      return Promise.reject(new Error('Error de conexión. Verifique su internet.'));
    }
    
    // Error personalizado del servidor
    const serverMessage = error.response.data?.message || error.response.data?.detail;
    if (serverMessage) {
      return Promise.reject(new Error(serverMessage));
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance; 