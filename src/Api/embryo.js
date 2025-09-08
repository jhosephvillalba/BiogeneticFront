import axios from './instance';

// Obtener producción embrionaria por cliente
export const getProductionByClient = async (clientId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/embryo-production/client/${clientId}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener producción embrionaria:", error);
    throw error;
  }
};

// Crear nueva producción embrionaria
export const createProduction = async (productionData) => {
  try {
    const response = await axios.post('/embryo-production', productionData);
    return response.data;
  } catch (error) {
    console.error("Error al crear producción embrionaria:", error);
    throw error;
  }
};

// Actualizar producción embrionaria
export const updateProduction = async (id, productionData) => {
  try {
    const response = await axios.put(`/embryo-production/${id}`, productionData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar producción embrionaria:", error);
    throw error;
  }
};

// Eliminar producción embrionaria
export const deleteProduction = async (id) => {
  try {
    const response = await axios.delete(`/embryo-production/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar producción embrionaria:", error);
    throw error;
  }
};

// Obtener detalles de una producción embrionaria
export const getProductionDetails = async (id) => {
  try {
    const response = await axios.get(`/embryo-production/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener detalles de producción embrionaria:", error);
    throw error;
  }
}; 