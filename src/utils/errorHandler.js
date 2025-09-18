/**
 * Utilidad para manejo global de errores
 */

// Detectar si estamos en producción
const isProduction = import.meta.env.PROD;

/**
 * Logger para diferentes niveles
 */
export const logger = {
  info: (message, data = null) => {
    if (!isProduction) {
      console.log(`[INFO] ${message}`, data || '');
    }
  },
  
  warn: (message, data = null) => {
    if (!isProduction) {
      console.warn(`[WARN] ${message}`, data || '');
    }
  },
  
  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error || '');
    
    // En producción, podrías enviar a un servicio de monitoreo
    if (isProduction && error) {
      // Aquí podrías integrar Sentry, LogRocket, etc.
      // sendToMonitoringService(message, error);
    }
  }
};

/**
 * Maneja errores de API de forma consistente
 * @param {Error} error - Error capturado
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {string} - Mensaje de error amigable para el usuario
 */
export const handleApiError = (error, context = 'API') => {
  logger.error(`Error en ${context}:`, error);
  
  // Si es un error personalizado que ya tiene mensaje
  if (error.message && !error.response) {
    return error.message;
  }
  
  // Si hay respuesta del servidor
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return 'Datos inválidos. Verifique la información ingresada.';
      case 401:
        return 'Sesión expirada. Por favor, inicie sesión nuevamente.';
      case 403:
        return 'No tiene permisos para realizar esta acción.';
      case 404:
        return 'Recurso no encontrado.';
      case 409:
        return 'Conflicto: El recurso ya existe o está en uso.';
      case 422:
        return data?.detail || 'Datos de entrada inválidos.';
      case 429:
        return 'Demasiadas solicitudes. Intente más tarde.';
      case 500:
        return 'Error interno del servidor. Intente más tarde.';
      case 502:
        return 'Servidor no disponible. Intente más tarde.';
      case 503:
        return 'Servicio temporalmente no disponible.';
      default:
        return data?.message || data?.detail || 'Error del servidor.';
    }
  }
  
  // Si es error de red
  if (error.request) {
    return 'Error de conexión. Verifique su internet e intente nuevamente.';
  }
  
  // Si es error de configuración
  return 'Error inesperado. Intente más tarde.';
};

/**
 * Maneja errores de validación de formularios
 * @param {Object} errors - Errores de validación
 * @returns {Object} - Errores formateados para mostrar
 */
export const handleValidationErrors = (errors) => {
  if (!errors || typeof errors !== 'object') {
    return {};
  }
  
  const formattedErrors = {};
  
  // Si es un array de errores (FastAPI style)
  if (Array.isArray(errors)) {
    errors.forEach(error => {
      if (error.loc && error.msg) {
        const field = error.loc[error.loc.length - 1];
        formattedErrors[field] = error.msg;
      }
    });
  } else {
    // Si es un objeto de errores
    Object.keys(errors).forEach(key => {
      const error = errors[key];
      if (Array.isArray(error)) {
        formattedErrors[key] = error[0];
      } else if (typeof error === 'string') {
        formattedErrors[key] = error;
      }
    });
  }
  
  return formattedErrors;
};

/**
 * Muestra notificación de error al usuario
 * @param {string} message - Mensaje de error
 * @param {string} type - Tipo de notificación (error, warning, info)
 */
export const showErrorNotification = (message, type = 'error') => {
  // Crear elemento de notificación
  const notification = document.createElement('div');
  notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
  notification.style.cssText = `
    top: 20px;
    right: 20px;
    z-index: 9999;
    min-width: 300px;
    max-width: 500px;
  `;
  
  notification.innerHTML = `
    <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}-fill me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  // Agregar al DOM
  document.body.appendChild(notification);
  
  // Auto-remover después de 5 segundos
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 5000);
};

/**
 * Wrapper para funciones async con manejo de errores
 * @param {Function} asyncFn - Función async
 * @param {string} context - Contexto del error
 * @param {Function} onError - Callback de error opcional
 * @returns {Function} - Función envuelta
 */
export const withErrorHandling = (asyncFn, context = 'Operación', onError = null) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const errorMessage = handleApiError(error, context);
      
      if (onError) {
        onError(errorMessage, error);
      } else {
        showErrorNotification(errorMessage);
      }
      
      throw error;
    }
  };
};

export default {
  logger,
  handleApiError,
  handleValidationErrors,
  showErrorNotification,
  withErrorHandling
};
