import axios from './axios';

// Añadir un output a un input
export const createOutput = async (inputId, outputData) => {
  try {
    const response = await axios.post(`/inputs/${inputId}/outputs`, outputData);
    return response.data;
  } catch (error) {
    console.error("Error al crear output:", error);
    throw error;
  }
};

// Obtener todos los outputs (con filtros opcionales)
export const getOutputs = async (filters = {}, skip = 0, limit = 100) => {
  try {
    let queryParams = new URLSearchParams();
    
    // Añadir filtros básicos de paginación
    queryParams.append('skip', skip);
    queryParams.append('limit', limit);
    
    // Añadir el resto de filtros
    if (filters.search_query) queryParams.append('search_query', filters.search_query);
    if (filters.date_from) queryParams.append('date_from', filters.date_from);
    if (filters.date_to) queryParams.append('date_to', filters.date_to);
    
    const response = await axios.get(`/outputs?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener outputs:", error);
    throw error;
  }
};

// Obtener outputs por input
export const getOutputsByInput = async (inputId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/outputs/input/${inputId}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener outputs por input:", error);
    throw error;
  }
};

// Obtener un output por ID
export const getOutputById = async (outputId) => {
  try {
    const response = await axios.get(`/outputs/${outputId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener el output:", error);
    throw error;
  }
};

// Actualizar un output existente
export const updateOutput = async (outputId, outputData) => {
  try {
    const response = await axios.put(`/outputs/${outputId}`, outputData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar el output:", error);
    throw error;
  }
};

// Eliminar un output
export const deleteOutput = async (outputId) => {
  try {
    const response = await axios.delete(`/outputs/${outputId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar el output:", error);
    throw error;
  }
};

// Crear un output directamente (método alternativo)
export const createOutputDirectly = async (outputData) => {
  try {
    const response = await axios.post('/outputs', outputData);
    return response.data;
  } catch (error) {
    console.error("Error al crear output directamente:", error);
    throw error;
  }
}; 