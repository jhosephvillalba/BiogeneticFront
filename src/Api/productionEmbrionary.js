import axios from './instance';


 export const getAllProductions = async (filters={}, skip=0, limit=10) => {
    try {
      const { query, fecha_inicio, fecha_fin } = filters; 
      let uri = '/produccion-embrionaria/';
      const params = new URLSearchParams();

      // Parámetros de paginación
      params.append('skip', skip);
      params.append('limit', limit);

      // Parámetros de filtro
      if(query) params.append('query', query);
      if(fecha_inicio) params.append('fecha_inicio', fecha_inicio);
      if(fecha_fin) params.append('fecha_fin', fecha_fin);

      const queryString = params.toString();
      if(queryString) {
        uri += `?${queryString}`;
      }

      console.log('URL de la petición:', uri);
      console.log('Parámetros enviados:', { skip, limit, filters });

      const response = await axios.get(uri);
      
      console.log('Respuesta del servidor:', {
        dataLength: Array.isArray(response.data) ? response.data.length : 'No es array',
        totalItems: response.data?.total || response.data?.count || 'No disponible',
        responseType: typeof response.data
      });
      
      return response.data;
    } catch (error) {
      console.error('Error al obtener producciones:', error);
      throw error;
    }
  }

  /**
   * Crea una nueva producción embrionaria
   * POST /produccion-embrionaria/
   */
 export const createProduction = async (productionData) => {
    try {
      const response = await axios.post('/produccion-embrionaria/', productionData);
      return response.data;
    } catch (error) {
      console.error('Error al crear producción:', error);
      throw error;
    }
  }

  /**
   * Actualiza una producción embrionaria existente
   * PUT /produccion-embrionaria/{production_id}
   */
  export const updateProduction = async (productionId, productionData) => {
    try {
      const response = await axios.put(`/produccion-embrionaria/${productionId}`, productionData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar producción:', error);
      throw error;
    }
  }

  /**
   * Obtiene las producciones embrionarias del usuario actual
   * GET /produccion-embrionaria/mis
   */
  export const getMyProductions = async () => {
    try {
      const response = await axios.get('/produccion-embrionaria/mis');
      return response.data;
    } catch (error) {
      console.error('Error al obtener mis producciones:', error);
      throw error;
    }
  }

  /**
   * Obtiene una producción embrionaria específica por ID
   * GET /produccion-embrionaria/{production_id}
   */
  export const getProductionById =  async (productionId) => {
    try {
      const response = await axios.get(`/produccion-embrionaria/${productionId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener producción por ID:', error);
      throw error;
    }
  }

  /**
   * Elimina una producción embrionaria
   * DELETE /produccion-embrionaria/{production_id}
   */
  export const deleteProduction =  async (productionId) => {
    try {
      const response = await axios.delete(`/produccion-embrionaria/${productionId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar producción:', error);
      throw error;
    }
  }

  // Servicio para obtener el resumen de toros por producción embrionaria
  export const getBullsSummaryByProductionId = async (productionId) => {
    try {
      const response = await axios.get(`/produccion-embrionaria/${productionId}/bulls-summary`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener el resumen de toros:', error);
      throw error;
    }
  };




// Ejemplo de uso:
/*
import productionEmbryonaryService from './productionEmbrionary.js';

// Obtener todas las producciones (Admin)
const productions = await productionEmbryonaryService.getAllProductions();

// Crear nueva producción
const newProduction = await productionEmbryonaryService.createProduction({
  name: 'Producción 1',
  description: 'Descripción de la producción',
  // ... otros campos
});

// Actualizar producción
const updatedProduction = await productionEmbryonaryService.updateProduction(1, {
  name: 'Producción actualizada',
  // ... otros campos
});

// Obtener mis producciones
const myProductions = await productionEmbryonaryService.getMyProductions();

// Obtener producción por ID
const production = await productionEmbryonaryService.getProductionById(1);

// Eliminar producción
await productionEmbryonaryService.deleteProduction(1);
*/