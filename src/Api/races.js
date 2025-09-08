import axios from './instance';

// Obtener todas las razas
export const getRaces = async (skip = 0, limit = 100) => {
  const response = await axios.get(`/races/?skip=${skip}&limit=${limit}`);
  return response.data;
};

// Crear una nueva raza
export const createRace = async (raceData) => {
  const response = await axios.post('/races/', raceData);
  return response.data;
};

// Obtener una raza por ID
export const getRaceById = async (raceId) => {
  const response = await axios.get(`/races/${raceId}`);
  return response.data;
};

// Actualizar una raza
export const updateRace = async (raceId, raceData) => {
  const response = await axios.put(`/races/${raceId}`, raceData);
  return response.data;
};

// Eliminar una raza
export const deleteRace = async (raceId) => {
  const response = await axios.delete(`/races/${raceId}`);
  return response.data;
}; 