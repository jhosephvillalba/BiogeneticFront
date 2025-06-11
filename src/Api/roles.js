import axios from './instance';

// Obtener todos los roles
export const getRoles = async (skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/roles?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo roles:", error);
    throw error;
  }
};

// Crear un nuevo rol
export const createRole = async (roleName) => {
  try {
    const response = await axios.post('/roles', { name: roleName });
    return response.data;
  } catch (error) {
    console.error("Error creando rol:", error);
    throw error;
  }
};

// Obtener un rol por ID
export const getRoleById = async (roleId) => {
  try {
    const response = await axios.get(`/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo rol con ID ${roleId}:`, error);
    throw error;
  }
};

// Actualizar un rol
export const updateRole = async (roleId, roleName) => {
  try {
    const response = await axios.put(`/roles/${roleId}`, { name: roleName });
    return response.data;
  } catch (error) {
    console.error(`Error actualizando rol con ID ${roleId}:`, error);
    throw error;
  }
};

// Eliminar un rol
export const deleteRole = async (roleId) => {
  try {
    const response = await axios.delete(`/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error eliminando rol con ID ${roleId}:`, error);
    throw error;
  }
};

// Asignar rol a usuario
export const assignRole = async (userId, roleId) => {
  const response = await axios.post('/roles/assign', { user_id: userId, role_id: roleId });
  return response.data;
};

// Quitar rol a usuario
export const removeRole = async (userId, roleId) => {
  const response = await axios.post('/roles/remove', { user_id: userId, role_id: roleId });
  return response.data;
}; 