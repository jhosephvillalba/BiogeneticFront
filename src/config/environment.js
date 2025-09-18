/**
 * Configuración de entorno
 * Centraliza todas las variables de entorno de la aplicación
 */

// Configuraciones por defecto
const defaultConfig = {
  API_URL: 'https://api.biogenetic.com.co/api',
  APP_NAME: 'Biogenetic',
  APP_VERSION: '1.0.0',
  APP_ENV: 'production',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
};

// Configuraciones específicas por entorno
const environmentConfigs = {
  development: {
    API_URL: 'http://127.0.0.1:8000/api',
    APP_ENV: 'development',
    DEBUG: true,
  },
  production: {
    API_URL: 'https://api.biogenetic.com.co/api',
    APP_ENV: 'production',
    DEBUG: false,
  },
  staging: {
    API_URL: 'https://staging-api.biogenetic.com.co/api',
    APP_ENV: 'staging',
    DEBUG: true,
  }
};

// Detectar el entorno actual
const getCurrentEnvironment = () => {
  // Prioridad: VITE_APP_ENV > NODE_ENV > 'production'
  return import.meta.env.VITE_APP_ENV || 
         import.meta.env.MODE || 
         'production';
};

// Obtener configuración actual
const getConfig = () => {
  const env = getCurrentEnvironment();
  const envConfig = environmentConfigs[env] || environmentConfigs.production;
  
  return {
    ...defaultConfig,
    ...envConfig,
    // Variables de entorno de Vite
    API_URL: import.meta.env.VITE_API_URL || envConfig.API_URL,
    APP_NAME: import.meta.env.VITE_APP_NAME || defaultConfig.APP_NAME,
    APP_VERSION: import.meta.env.VITE_APP_VERSION || defaultConfig.APP_VERSION,
  };
};

// Configuración actual
export const config = getConfig();

// Funciones de utilidad
export const isDevelopment = () => config.APP_ENV === 'development';
export const isProduction = () => config.APP_ENV === 'production';
export const isStaging = () => config.APP_ENV === 'staging';

// Logger condicional
export const log = {
  info: (message, data) => {
    if (config.DEBUG) {
      console.log(`[${config.APP_NAME}] ${message}`, data || '');
    }
  },
  warn: (message, data) => {
    if (config.DEBUG) {
      console.warn(`[${config.APP_NAME}] ${message}`, data || '');
    }
  },
  error: (message, error) => {
    console.error(`[${config.APP_NAME}] ${message}`, error || '');
  }
};

export default config;
