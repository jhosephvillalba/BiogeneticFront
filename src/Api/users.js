import axios from './instance';

// Obtener todos los usuarios con paginación y soporte de filtrado
export const getUsers = async (skip = 0, limit = 100) => {
  try {
    const response = await axios.get(`/users?skip=${skip}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo usuarios:", error);
    throw error;
  }
};

// Filtrar usuarios por criterios específicos
export const filterUsers = async (filters = {}, skip = 0, limit = 100) => {
  try {
    const { email, full_name, number_document, role_id} = filters;
    let queryParams = `skip=${skip}&limit=${limit}`;
    
    if (email) queryParams += `&email=${encodeURIComponent(email)}`;
    if (full_name) queryParams += `&full_name=${encodeURIComponent(full_name)}`;
    if (number_document) queryParams += `&number_document=${encodeURIComponent(number_document)}`;
    if (role_id) queryParams += `&role_id=${role_id}`;
    
     // Añadir el filtro genérico si existe
    // if (query) queryParams += `&query=${encodeURIComponent(query)}`;

    const response = await axios.get(`/users/filter?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error("Error filtrando usuarios:", error);
    throw error;
  }
};

// Búsqueda general de usuarios
export const searchUsers = async (filters = {}, skip = 0, limit = 100) => {
  try {
    const { q, role_id } = filters;
    let queryParams = `skip=${skip}&limit=${limit}`;
    
    // if (email) queryParams += `&email=${encodeURIComponent(email)}`;
    // if (full_name) queryParams += `&full_name=${encodeURIComponent(full_name)}`;
    // if (number_document) queryParams += `&number_document=${encodeURIComponent(number_document)}`;
    if (role_id) queryParams += `&role_id=${role_id}`;
    
     // Añadir el filtro genérico si existe
    if (q) queryParams += `&q=${q}`;

    const response = await axios.get(`/users/search?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error("Error filtrando usuarios:", error);
    throw error;
  }
};


// Crear un nuevo usuario (cliente por defecto)
export const createUser = async (userData) => {
  try {
    const response = await axios.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error("Error creando usuario:", error);
    throw error;
  }
};

// Crear un usuario con roles específicos (admin)
export const createUserWithRoles = async (userData) => {
  try {
    const response = await axios.post('/users/admin/create', userData);
    return response.data;
  } catch (error) {
    console.error("Error creando usuario con roles:", error);
    throw error;
  }
};

// Obtener un usuario por ID
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error obteniendo usuario con ID ${userId}:`, error);
    throw error;
  }
};

// Actualizar un usuario
export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    console.error(`Error actualizando usuario con ID ${userId}:`, error);
    throw error;
  }
};

// Eliminar un usuario
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error(`Error eliminando usuario con ID ${userId}:`, error);
    throw error;
  }
};

// Asignar un rol a un usuario
export const assignRoleToUser = async (userId, roleId) => {
  try {
    const response = await axios.put(`/users/${userId}/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error asignando rol ${roleId} al usuario ${userId}:`, error);
    throw error;
  }
};

// Quitar un rol a un usuario
export const removeRoleFromUser = async (userId, roleId) => {
  try {
    const response = await axios.delete(`/users/${userId}/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error(`Error eliminando rol ${roleId} del usuario ${userId}:`, error);
    throw error;
  }
};

// Subir foto de perfil (multipart/form-data)
export const uploadProfilePicture = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error subiendo foto de perfil:', error);
    throw error;
  }
}; 