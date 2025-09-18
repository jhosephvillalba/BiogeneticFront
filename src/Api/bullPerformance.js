import axiosInstance from './instance';

// Endpoint para obtener datos de rendimiento de toros
export const getBullPerformanceData = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Agregar filtros como parámetros de consulta
    if (filters.client_id) {
      params.append('client_id', filters.client_id);
    }
    if (filters.query) {
      params.append('query', filters.query);
    }
    if (filters.page) {
      params.append('page', filters.page);
    }
    if (filters.page_size) {
      params.append('page_size', filters.page_size);
    }

    const response = await axiosInstance.get(`/bull-performance/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener datos de rendimiento de toros:', error);
    throw error;
  }
};

// Endpoint para obtener solo el resumen estadístico
export const getBullPerformanceSummary = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    // Agregar filtros como parámetros de consulta
    if (filters.client_id) {
      params.append('client_id', filters.client_id);
    }
    if (filters.query) {
      params.append('query', filters.query);
    }

    const response = await axiosInstance.get(`/bull-performance/summary?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener resumen de rendimiento:', error);
    throw error;
  }
};

// Exportar como objeto para mantener consistencia con otros módulos de API
const bullPerformanceApi = {
  getBullPerformanceData,
  getBullPerformanceSummary
};

export default bullPerformanceApi;
