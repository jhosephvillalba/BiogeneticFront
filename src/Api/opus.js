import axios from './instance';

/**
 * Obtiene un registro de OPUS por su ID
 * @param {number} opusId - ID del registro OPUS
 * @returns {Promise<Object>} Registro OPUS
 */
export const getOpus = async (opusId) => {
  try {
    const response = await axios.get(`/opus/${opusId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene todos los registros de OPUS de un cliente específico
 * @param {number} clientId - ID del cliente
 * @param {number} skip - Número de registros a saltar (paginación)
 * @param {number} limit - Límite de registros a obtener
 * @returns {Promise<Array>} Lista de registros OPUS
 */
export const getOpusByClient = async (clientId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/opus/client/${clientId}`, {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Crea un nuevo registro de OPUS
 * @param {Object} opusData - Datos del registro OPUS
 * @returns {Promise<Object>} Registro OPUS creado
 */
export const createOpus = async (opusData) => {
  try {
    const response = await axios.post('/opus', opusData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Actualiza un registro de OPUS existente
 * @param {number} opusId - ID del registro OPUS
 * @param {Object} opusData - Datos actualizados del registro OPUS
 * @returns {Promise<Object>} Registro OPUS actualizado
 */
export const updateOpus = async (opusId, opusData) => {
  try {
    const response = await axios.put(`/opus/${opusId}`, opusData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Elimina un registro de OPUS
 * @param {number} opusId - ID del registro OPUS
 * @returns {Promise<boolean>} True si se eliminó correctamente
 */
export const deleteOpus = async (opusId) => {
  try {
    const response = await axios.delete(`/opus/${opusId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene el resumen de registros OPUS agrupados por fecha
 * @param {number} skip - Número de registros a saltar (paginación)
 * @param {number} limit - Límite de registros a obtener
 * @returns {Promise<Array>} Lista de resúmenes de OPUS agrupados por fecha
 * @example
 * [
 *   {
 *     fecha: "2025-05-28",
 *     cliente_nombre: "Cliente Regular",
 *     total_registros: 4,
 *     total_oocitos: 34,
 *     total_embriones: 4,
 *     porcentaje_exito: "11.76%",
 *     promedio_embriones: "1.00"
 *   }
 * ]
 */
export const getOpusGroupedByDate = async (skip = 0, limit = 100) => {
  try {
    const response = await axios.get('/opus/summary/by-date', {
      params: { skip, limit }
    });
    return response.data;
  } catch (error) {
    // Manejar errores específicos
    if (error.response) {
      // El servidor respondió con un estado de error
      const errorMessage = error.response.data?.detail || error.response.data?.message || 'Error del servidor';
      throw new Error(`Error al obtener resumen: ${errorMessage}`);
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      throw new Error('No se pudo conectar con el servidor');
    } else {
      // Error al configurar la solicitud
      throw new Error(`Error de conexión: ${error.message}`);
    }
  }
}; 


export const getOpusByProduction = async (id) => {
  try {
    const response = await axios.get(`/opus/by-production/${id}`);
    return response.data;
  } catch (error) {
    // Manejar errores específicos
    if (error.response) {
      // El servidor respondió con un estado de error
      const errorMessage = error.response.data?.detail || error.response.data?.message || 'Error del servidor';
      throw new Error(`Error al obtener resumen: ${errorMessage}`);
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      throw new Error('No se pudo conectar con el servidor');
    } else {
      // Error al configurar la solicitud
      throw new Error(`Error de conexión: ${error.message}`);
    }
  }
}; 