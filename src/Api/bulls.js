import axios from './instance';

// Obtener todos los toros
export const getBulls = async (skip = 0, limit = 100, date_from = null, date_to = null) => {
  try {
    let url = `/bulls?skip=${skip}&limit=${limit}`;
    
    // Añadir parámetros de fecha si están presentes
    if (date_from) url += `&date_from=${date_from}`;
    if (date_to) url += `&date_to=${date_to}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener toros del usuario actual
export const getMyBulls = async (skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/bulls/my-bulls?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener un toro por ID
export const getBull = async (id) => {
  try {
    const response = await axios.get(`/bulls/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Crear un nuevo toro
export const createBull = async (bullData) => {
  try {
    // Si se proporciona user_id, usar el endpoint específico para crear toro para un cliente
    if (bullData.user_id) {
      const { user_id, ...bullDataWithoutUserId } = bullData;
      const response = await axios.post(`/bulls/client/${user_id}`, bullDataWithoutUserId);
      return response.data;
    } else {
      // Caso normal: crear toro sin especificar cliente
      const response = await axios.post('/bulls', bullData);
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// Actualizar un toro existente
export const updateBull = async (id, bullData) => {
  try {
    const response = await axios.put(`/bulls/${id}`, bullData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Eliminar un toro
export const deleteBull = async (id) => {
  try {
    const response = await axios.delete(`/bulls/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Filtrar toros por criterios
export const filterBulls = async (filters = {}, skip = 0, limit = 5) => {
  try {
    // Asegurarse de que skip y limit sean números enteros válidos
    const params = {
      skip: Math.max(0, parseInt(skip) || 0),
      limit: Math.max(1, parseInt(limit) || 5)
    };

    // Mapeo de parámetros según la API
    if (filters.search_query) {
      console.log("Aplicando filtro de búsqueda:", filters.search_query);
      params.search_query = filters.search_query;
    }
    
    if (filters.date_from) {
      params.date_from = filters.date_from;
    }
    
    if (filters.date_to) {
      params.date_to = filters.date_to;
    }

    // Añadir otros filtros si existen, asegurando que los IDs sean números
    if (filters.name) params.name = filters.name;
    if (filters.register) params.register = filters.register;
    if (filters.race_id) params.race_id = parseInt(filters.race_id) || undefined;
    if (filters.sex_id) params.sex_id = parseInt(filters.sex_id) || undefined;
    if (filters.status) params.status = filters.status;
    
    console.log("Enviando parámetros a la API:", params);
    
    const response = await axios.get('/bulls/filter', { params });
    console.log("Respuesta recibida de la API:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error en filterBulls:", error);
    if (error.response?.data?.detail) {
      console.error("Detalles del error:", error.response.data);
    }
    throw error;
  }
};

// Obtener toros por raza
export const getBullsByRace = async (raceId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/bulls/race/${raceId}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener toros por sexo
export const getBullsBySex = async (sexId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/bulls/sex/${sexId}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Obtener toros por cliente
export const getBullsByClient = async (clientId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/bulls/client/${clientId}?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener toros del cliente:", error);
    throw error;
  }
};

export const getBullsWithAvailableSamples = async (clientId, skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/bulls/client/${clientId}/available-samples?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener toros del cliente:", error);
    throw error;
  }
};

// Obtener toros disponibles (con entradas disponibles) por cliente
export const getAvailableBullsByClient = async (clientId) => {
  try {
    const response = await axios.get(`/bulls/disponibles/${clientId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener toros disponibles del cliente:", error);
    throw error;
  }
}; 