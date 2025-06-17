import axios from './instance';

// Obtener todos los inputs
export const getInputs = async (skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/inputs?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener un input por ID
export const getInputById = async (id) => {
  try {
    const response = await axios.get(`/inputs/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo input
export const createInput = async (inputData) => {
  try {
    const response = await axios.post('/inputs', inputData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Actualizar un input existente
export const updateInput = async (inputId, inputData) => {
  try {
    const response = await axios.put(`/inputs/${inputId}`, inputData);
    return response;
  } catch (error) {
    console.error("Error al actualizar la entrada:", error);
    throw error;
  }
};

// Eliminar un input
export const deleteInput = async (id) => {
  try {
    const response = await axios.delete(`/inputs/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Cambiar el estado de un input
export const changeInputStatus = async (id, statusName) => {
  try {
    const response = await axios.put(`/inputs/${id}/status/${statusName}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Filtrar inputs por criterios
export const filterInputs = async (filters = {}, skip = 0, limit = 100) => {
  try {
    let queryParams = new URLSearchParams();
    
    // Añadir filtros básicos de paginación
    queryParams.append('skip', skip);
    queryParams.append('limit', limit);
    
    // Añadir el resto de filtros si existen
    if (filters.search_query) queryParams.append('search_query', filters.search_query);
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.bull_id) queryParams.append('bull_id', filters.bull_id);
    if (filters.input_id) queryParams.append('input_id', filters.input_id);
    

    console.log('URL de filtrado:', `/inputs/filter?${queryParams.toString()}`);
    
    const response = await axios.get(`/inputs/filter?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error en filterInputs:', error);
    throw error;
  }
};

// Obtener inputs por usuario
export const getInputsByUser = async (userId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/inputs/user/${userId}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener inputs por toro
export const getInputsByBull = async (bullId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/inputs/bull/${bullId}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Añadir un output a un input
export const addOutputToInput = async (inputId, outputData) => {
  try {
    const response = await axios.post(`/inputs/${inputId}/outputs`, outputData);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 