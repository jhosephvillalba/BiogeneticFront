import axios from './instance';

// Obtener todos los sexos
export const getSexes = async (skip = 0, limit = 100) => {
  const response = await axios.get(`/sexes?skip=${skip}&limit=${limit}`);
  return response.data;
};

// Crear un nuevo sexo
export const createSex = async (sexData) => {
  const response = await axios.post('/sexes', sexData);
  return response.data;
};

// Obtener un sexo por ID
export const getSexById = async (sexId) => {
  const response = await axios.get(`/sexes/${sexId}`);
  return response.data;
};

// Actualizar un sexo
export const updateSex = async (sexId, sexData) => {
  const response = await axios.put(`/sexes/${sexId}`, sexData);
  return response.data;
};

// Eliminar un sexo
export const deleteSex = async (sexId) => {
  const response = await axios.delete(`/sexes/${sexId}`);
  return response.data;
}; 