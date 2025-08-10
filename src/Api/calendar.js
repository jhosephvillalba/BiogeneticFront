import axios from './instance';

// ========================================
// 1. GESTIÓN DE TAREAS DEL CALENDARIO
// ========================================

/**
 * Obtener todas las tareas del calendario con paginación
 * @param {number} skip - Número de registros a saltar
 * @param {number} limit - Número máximo de registros a retornar
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} Lista de tareas con metadatos
 */
export const getCalendarTasks = async (skip = 0, limit = 100, filters = {}) => {
  try {
    const params = { skip, limit, ...filters };
    const response = await axios.get('/calendar/tasks', { params });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo tareas del calendario:", error);
    throw error;
  }
};

/**
 * Obtener tareas por cliente específico
 * @param {number} clientId - ID del cliente
 * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<Array>} Lista de tareas del cliente
 */
export const getClientTasks = async (clientId, startDate, endDate) => {
  try {
    const response = await axios.get(`/calendar/tasks/client/${clientId}`, {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo tareas del cliente:", error);
    throw error;
  }
};

/**
 * Obtener tareas para una fecha específica
 * @param {string} date - Fecha (YYYY-MM-DD)
 * @returns {Promise<Array>} Lista de tareas para la fecha
 */
export const getTasksByDate = async (date) => {
  try {
    const response = await axios.get(`/calendar/tasks/date/${date}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo tareas por fecha:", error);
    throw error;
  }
};

/**
 * Obtener tareas por rango de fechas
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @param {number} clientId - ID del cliente (opcional)
 * @returns {Promise<Array>} Lista de tareas en el rango
 */
export const getTasksByDateRange = async (startDate, endDate, clientId = null) => {
  try {
    const params = { start_date: startDate, end_date: endDate };
    if (clientId) params.client_id = clientId;
    
    const response = await axios.get('/calendar/tasks/date-range', { params });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo tareas por rango:", error);
    throw error;
  }
};

/**
 * Buscar tareas por criterios
 * @param {Object} filters - Filtros de búsqueda
 * @param {number} skip - Número de registros a saltar
 * @param {number} limit - Número máximo de registros
 * @returns {Promise<Object>} Lista de tareas filtradas con metadatos
 */
export const searchTasks = async (filters = {}, skip = 0, limit = 100) => {
  try {
    const params = { skip, limit, ...filters };
    const response = await axios.get('/calendar/tasks/search', { params });
    return response.data;
  } catch (error) {
    console.error("Error buscando tareas:", error);
    throw error;
  }
};

/**
 * Obtener una tarea específica por ID
 * @param {number} taskId - ID de la tarea
 * @returns {Promise<Object>} Tarea específica
 */
export const getTaskById = async (taskId) => {
  try {
    const response = await axios.get(`/calendar/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo tarea por ID:", error);
    throw error;
  }
};

/**
 * Crear una nueva tarea individual
 * @param {Object} taskData - Datos de la tarea
 * @returns {Promise<Object>} Tarea creada
 */
export const createTask = async (taskData) => {
  try {
    const response = await axios.post('/calendar/tasks', taskData);
    return response.data;
  } catch (error) {
    console.error("Error creando tarea:", error);
    throw error;
  }
};

/**
 * Crear múltiples tareas semanales para un cliente
 * @param {Object} weeklyData - Datos para crear tareas semanales
 * @returns {Promise<Array>} Lista de tareas creadas
 */
export const createWeeklyTasks = async (weeklyData) => {
  try {
    const response = await axios.post('/calendar/tasks/weekly', weeklyData);
    return response.data;
  } catch (error) {
    console.error("Error creando tareas semanales:", error);
    throw error;
  }
};

/**
 * Crear tareas desde un template
 * @param {number} templateId - ID del template
 * @param {number} clientId - ID del cliente
 * @param {string} startDate - Fecha de inicio
 * @returns {Promise<Array>} Lista de tareas creadas
 */
export const createTasksFromTemplate = async (templateId, clientId, startDate) => {
  try {
    const response = await axios.post('/calendar/tasks/from-template', {
      template_id: templateId,
      client_id: clientId,
      start_date: startDate
    });
    return response.data;
  } catch (error) {
    console.error("Error creando tareas desde template:", error);
    throw error;
  }
};

/**
 * Actualizar una tarea existente
 * @param {number} taskId - ID de la tarea
 * @param {Object} taskData - Datos actualizados
 * @returns {Promise<Object>} Tarea actualizada
 */
export const updateTask = async (taskId, taskData) => {
  try {
    const response = await axios.put(`/calendar/tasks/${taskId}`, taskData);
    return response.data;
  } catch (error) {
    console.error("Error actualizando tarea:", error);
    throw error;
  }
};

/**
 * Cambiar el estado de una tarea (pendiente/completada)
 * @param {number} taskId - ID de la tarea
 * @returns {Promise<Object>} Tarea actualizada
 */
export const toggleTaskStatus = async (taskId) => {
  try {
    const response = await axios.patch(`/calendar/tasks/${taskId}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error("Error cambiando estado de tarea:", error);
    throw error;
  }
};

/**
 * Eliminar una tarea
 * @param {number} taskId - ID de la tarea
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export const deleteTask = async (taskId) => {
  try {
    const response = await axios.delete(`/calendar/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error("Error eliminando tarea:", error);
    throw error;
  }
};

// ========================================
// 2. GESTIÓN DE TIPOS DE TAREAS
// ========================================

/**
 * Obtener todos los tipos de tareas disponibles
 * @param {number} skip - Número de registros a saltar
 * @param {number} limit - Número máximo de registros
 * @param {boolean} activeOnly - Solo tipos activos
 * @returns {Promise<Object>} Lista de tipos de tareas con metadatos
 */
export const getTaskTypes = async (skip = 0, limit = 100, activeOnly = true) => {
  try {
    const params = { skip, limit, active_only: activeOnly };
    const response = await axios.get('/calendar/task-types', { params });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo tipos de tareas:", error);
    throw error;
  }
};

/**
 * Obtener un tipo de tarea específico
 * @param {number} taskTypeId - ID del tipo de tarea
 * @returns {Promise<Object>} Tipo de tarea específico
 */
export const getTaskTypeById = async (taskTypeId) => {
  try {
    const response = await axios.get(`/calendar/task-types/${taskTypeId}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo tipo de tarea:", error);
    throw error;
  }
};

/**
 * Crear un nuevo tipo de tarea
 * @param {Object} taskTypeData - Datos del tipo de tarea
 * @returns {Promise<Object>} Tipo de tarea creado
 */
export const createTaskType = async (taskTypeData) => {
  try {
    const response = await axios.post('/calendar/task-types', taskTypeData);
    return response.data;
  } catch (error) {
    console.error("Error creando tipo de tarea:", error);
    throw error;
  }
};

/**
 * Actualizar un tipo de tarea
 * @param {number} taskTypeId - ID del tipo de tarea
 * @param {Object} taskTypeData - Datos actualizados
 * @returns {Promise<Object>} Tipo de tarea actualizado
 */
export const updateTaskType = async (taskTypeId, taskTypeData) => {
  try {
    const response = await axios.put(`/calendar/task-types/${taskTypeId}`, taskTypeData);
    return response.data;
  } catch (error) {
    console.error("Error actualizando tipo de tarea:", error);
    throw error;
  }
};

/**
 * Eliminar un tipo de tarea
 * @param {number} taskTypeId - ID del tipo de tarea
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export const deleteTaskType = async (taskTypeId) => {
  try {
    const response = await axios.delete(`/calendar/task-types/${taskTypeId}`);
    return response.data;
  } catch (error) {
    console.error("Error eliminando tipo de tarea:", error);
    throw error;
  }
};

// ========================================
// 3. GESTIÓN DE PLANTILLAS
// ========================================

/**
 * Obtener todas las plantillas disponibles
 * @param {number} skip - Número de registros a saltar
 * @param {number} limit - Número máximo de registros
 * @param {boolean} activeOnly - Solo plantillas activas
 * @returns {Promise<Object>} Lista de plantillas con metadatos
 */
export const getTemplates = async (skip = 0, limit = 100, activeOnly = true) => {
  try {
    const params = { skip, limit, active_only: activeOnly };
    const response = await axios.get('/calendar/templates', { params });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo plantillas:", error);
    throw error;
  }
};

/**
 * Obtener una plantilla específica con sus tareas
 * @param {number} templateId - ID de la plantilla
 * @returns {Promise<Object>} Plantilla con tareas
 */
export const getTemplate = async (templateId) => {
  try {
    const response = await axios.get(`/calendar/templates/${templateId}`);
    return response.data;
  } catch (error) {
    console.error("Error obteniendo plantilla:", error);
    throw error;
  }
};

/**
 * Crear una nueva plantilla
 * @param {Object} templateData - Datos de la plantilla
 * @returns {Promise<Object>} Plantilla creada
 */
export const createTemplate = async (templateData) => {
  try {
    const response = await axios.post('/calendar/templates', templateData);
    return response.data;
  } catch (error) {
    console.error("Error creando plantilla:", error);
    throw error;
  }
};

/**
 * Actualizar una plantilla
 * @param {number} templateId - ID de la plantilla
 * @param {Object} templateData - Datos actualizados
 * @returns {Promise<Object>} Plantilla actualizada
 */
export const updateTemplate = async (templateId, templateData) => {
  try {
    const response = await axios.put(`/calendar/templates/${templateId}`, templateData);
    return response.data;
  } catch (error) {
    console.error("Error actualizando plantilla:", error);
    throw error;
  }
};

/**
 * Eliminar una plantilla
 * @param {number} templateId - ID de la plantilla
 * @returns {Promise<Object>} Respuesta de eliminación
 */
export const deleteTemplate = async (templateId) => {
  try {
    const response = await axios.delete(`/calendar/templates/${templateId}`);
    return response.data;
  } catch (error) {
    console.error("Error eliminando plantilla:", error);
    throw error;
  }
};

// ========================================
// 4. CONSULTAS Y REPORTES
// ========================================

/**
 * Obtener estadísticas del calendario
 * @param {string} startDate - Fecha de inicio
 * @param {string} endDate - Fecha de fin
 * @returns {Promise<Object>} Estadísticas del período
 */
export const getCalendarStats = async (startDate, endDate) => {
  try {
    const response = await axios.get('/calendar/stats', {
      params: { start_date: startDate, end_date: endDate }
    });
    return response.data;
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);
    throw error;
  }
};

// ========================================
// 5. OPERACIONES EN LOTE
// ========================================

/**
 * Eliminar múltiples tareas
 * @param {Array<number>} taskIds - Array de IDs de tareas
 * @returns {Promise<Object>} Resultado de la operación
 */
export const deleteMultipleTasks = async (taskIds) => {
  try {
    const response = await axios.delete('/calendar/tasks/bulk', {
      data: { task_ids: taskIds }
    });
    return response.data;
  } catch (error) {
    console.error("Error eliminando múltiples tareas:", error);
    throw error;
  }
};

/**
 * Actualizar estado de múltiples tareas
 * @param {Array<number>} taskIds - Array de IDs de tareas
 * @param {string} status - Nuevo estado
 * @returns {Promise<Object>} Resultado de la operación
 */
export const updateMultipleTaskStatus = async (taskIds, status) => {
  try {
    const response = await axios.patch('/calendar/tasks/bulk-status', {
      task_ids: taskIds,
      status
    });
    return response.data;
  } catch (error) {
    console.error("Error actualizando estado de múltiples tareas:", error);
    throw error;
  }
};

/**
 * Duplicar tareas de un cliente a otro
 * @param {number} sourceClientId - ID del cliente origen
 * @param {number} targetClientId - ID del cliente destino
 * @param {string} startDate - Nueva fecha de inicio
 * @returns {Promise<Array>} Lista de tareas duplicadas
 */
export const duplicateClientTasks = async (sourceClientId, targetClientId, startDate) => {
  try {
    const response = await axios.post('/calendar/tasks/duplicate', {
      source_client_id: sourceClientId,
      target_client_id: targetClientId,
      start_date: startDate
    });
    return response.data;
  } catch (error) {
    console.error("Error duplicando tareas:", error);
    throw error;
  }
};

// ========================================
// 6. EXPORTACIÓN E IMPORTACIÓN
// ========================================

/**
 * Exportar tareas a formato CSV
 * @param {Object} filters - Filtros para la exportación
 * @returns {Promise<Blob>} Archivo CSV
 */
export const exportTasksToCSV = async (filters = {}) => {
  try {
    const response = await axios.get('/calendar/tasks/export/csv', {
      params: filters,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error("Error exportando tareas:", error);
    throw error;
  }
};

/**
 * Importar tareas desde archivo CSV
 * @param {File} file - Archivo CSV
 * @returns {Promise<Object>} Resultado de la importación
 */
export const importTasksFromCSV = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post('/calendar/tasks/import/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error importando tareas:", error);
    throw error;
  }
};

// ========================================
// 7. UTILIDADES Y HELPERS
// ========================================

/**
 * Descargar archivo CSV
 * @param {Blob} blob - Archivo blob
 * @param {string} filename - Nombre del archivo
 */
export const downloadCSV = (blob, filename = 'calendar_tasks.csv') => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Exportar y descargar tareas como CSV
 * @param {Object} filters - Filtros para la exportación
 * @param {string} filename - Nombre del archivo
 */
export const exportAndDownloadTasks = async (filters = {}, filename = 'calendar_tasks.csv') => {
  try {
    const blob = await exportTasksToCSV(filters);
    downloadCSV(blob, filename);
  } catch (error) {
    console.error("Error exportando y descargando tareas:", error);
    throw error;
  }
}; 

// ========================================
// 8. CONSTANTES Y ENUMS
// ========================================

export const TASK_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TASK_TYPES = {
  OPUS: 'opus',
  FIV: 'fiv',
  CIV: 'civ',
  D3: 'd3',
  D5: 'd5',
  PREVISION: 'prevision',
  INFORME: 'informe'
};

export const DEFAULT_COLORS = {
  OPUS: { background: '#f8d7da', foreground: '#721c24' },
  FIV: { background: '#d1ecf1', foreground: '#0c5460' },
  CIV: { background: '#e2e3e5', foreground: '#383d41' },
  D3: { background: '#fff3cd', foreground: '#856404' },
  D5: { background: '#d4edda', foreground: '#155724' },
  PREVISION: { background: '#cce5ff', foreground: '#004085' },
  INFORME: { background: '#f8f9fa', foreground: '#6c757d' }
};

// ========================================
// 9. EXPORTACIÓN POR DEFECTO
// ========================================

export default {
  // Tareas
  getCalendarTasks,
  getClientTasks,
  getTasksByDate,
  getTasksByDateRange,
  searchTasks,
  getTaskById,
  createTask,
  createWeeklyTasks,
  createTasksFromTemplate,
  updateTask,
  toggleTaskStatus,
  deleteTask,
  
  // Tipos de tareas
  getTaskTypes,
  getTaskTypeById,
  createTaskType,
  updateTaskType,
  deleteTaskType,
  
  // Plantillas
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  
  // Consultas y reportes
  getCalendarStats,
  
  // Operaciones en lote
  deleteMultipleTasks,
  updateMultipleTaskStatus,
  duplicateClientTasks,
  
  // Exportación/Importación
  exportTasksToCSV,
  importTasksFromCSV,
  exportAndDownloadTasks,
  
  // Utilidades
  downloadCSV,
  
  // Constantes
  TASK_STATUS,
  TASK_TYPES,
  DEFAULT_COLORS
};
