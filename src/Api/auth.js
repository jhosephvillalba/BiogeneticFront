import axios from './instance';

export const login = async (credentials) => {
  const response = await axios.post('/auth/login', credentials);
  
  // Guardar el token en localStorage cuando se obtiene con éxito
  if (response.data && response.data.access_token) {
    localStorage.setItem('token', response.data.access_token);
  }
  
  return response.data;
};

export const logout = () => {
  // Eliminar el token del localStorage al cerrar sesión
  localStorage.removeItem('token');
};

// Registro de usuario
export const register = async (userData) => {
  const response = await axios.post('/auth/register', userData);
  return response.data;
};

// Obtener información del usuario actual
export const getCurrentUser = async () => {
  const response = await axios.get('/auth/me');
  return response.data;
};

// Guardar token en cookie (si se usa esta funcionalidad)
export const saveTokenInCookie = async (token, redirectUrl) => {
  const response = await axios.post('/auth/token-to-cookie', { 
    token, 
    redirect_url: redirectUrl 
  });
  return response.data;
};

// Eliminar token de cookie
export const clearTokenFromCookie = async () => {
  const response = await axios.post('/auth/clear-token');
  return response.data;
};

// Función para solicitar recuperación de contraseña
export const requestPasswordReset = async (email) => {
  const response = await axios.post('/auth/password-reset-request', { email });
  return response.data;
};

// Función para confirmar reseteo de contraseña
export const resetPassword = async (token, newPassword) => {
  const response = await axios.post('/auth/password-reset', { 
    token, 
    new_password: newPassword 
  });
  return response.data;
}; 