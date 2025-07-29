import axios from './instance';

// Obtener transferencias paginadas con búsqueda opcional
export const getAllTransferencias = async (skip = 0, limit = 100, search = null) => {
  try {
    const params = new URLSearchParams();
    params.append('skip', skip);
    params.append('limit', limit);
    
    if (search) {
      params.append('search', search);
    }
    
    const queryString = params.toString();
    const url = `/transferencias/${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error('Error al obtener transferencias:', error);
    throw error;
  }
};

// Crear transferencia
export const createTransferencia = async (data) => {
  const response = await axios.post('/transferencias/', data);
  return response.data;
};

// Obtener transferencia por ID
export const getTransferencia = async (transferenciaId) => {
  const response = await axios.get(`/transferencias/${transferenciaId}`);
  return response.data;
};

// Actualizar transferencia
export const updateTransferencia = async (transferenciaId, data) => {
  const response = await axios.put(`/transferencias/${transferenciaId}`, data);
  return response.data;
};

// Eliminar transferencia
export const deleteTransferencia = async (transferenciaId) => {
  const response = await axios.delete(`/transferencias/${transferenciaId}`);
  return response.data;
};

// Obtener transferencias por producción
export const getTransferenciasByProduccion = async (produccionId) => {
  const response = await axios.get(`/transferencias/by-produccion/${produccionId}`);
  return response.data;
};

// Crear reporte de transferencia
export const createReportTransfer = async (transferenciaId, data) => {
  const response = await axios.post(`/transferencias/${transferenciaId}/reportes`, data);
  return response.data;
};

// Actualizar reporte de transferencia
export const updateReportTransfer = async (reporteId, data) => {
  const response = await axios.put(`/transferencias/reportes/${reporteId}`, data);
  return response.data;
};

// Eliminar reporte de transferencia
export const deleteReportTransfer = async (reporteId) => {
  const response = await axios.delete(`/transferencias/reportes/${reporteId}`);
  return response.data;
}; 