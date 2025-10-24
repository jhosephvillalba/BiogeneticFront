import axios from './instance.js';

const payments = {
  // Crear pago PSE
  createPsePayment: async (paymentData) => {
    try {
      console.log('Creando pago PSE:', paymentData);
      const response = await axios.post('pagos/pse/create', paymentData);
      console.log('Respuesta de pago PSE:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear pago PSE:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Obtener formulario de pago PSE
  getPsePaymentForm: async (facturaId) => {
    try {
      console.log('Obteniendo formulario PSE para factura:', facturaId);
      const response = await axios.get(`pagos/pse/create/${facturaId}`);
      console.log('Formulario PSE obtenido');
      return response.data;
    } catch (error) {
      console.error('Error al obtener formulario PSE:', error);
      throw error;
    }
  },

  // Consultar estado de un pago específico
  getPaymentStatus: async (pagoId) => {
    try {
      console.log('Consultando estado de pago:', pagoId);
      const response = await axios.get(`pagos/${pagoId}/status`);
      console.log('Estado de pago obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al consultar estado de pago:', error);
      throw error;
    }
  },

  // Listar pagos del usuario actual
  getPayments: async (filters = {}) => {
    try {
      const { skip = 0, limit = 100 } = filters;
      const queryParams = `skip=${skip}&limit=${limit}`;
      
      console.log('Obteniendo lista de pagos:', filters);
      const response = await axios.get(`pagos/?${queryParams}`);
      console.log('Lista de pagos obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener lista de pagos:', error);
      throw error;
    }
  },

  // Actualizar un pago
  updatePayment: async (pagoId, paymentData) => {
    try {
      console.log('Actualizando pago:', pagoId, paymentData);
      const response = await axios.put(`pagos/${pagoId}`, paymentData);
      console.log('Pago actualizado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar pago:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Obtener lista de entidades bancarias para PSE
  getPseBanks: async () => {
    try {
      console.log('Obteniendo lista de bancos PSE');
      const response = await axios.get('pagos/banks');
      console.log('Lista de bancos PSE obtenida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener lista de bancos PSE:', error);
      throw error;
    }
  },

  // Obtener un pago específico por ID
  getPaymentById: async (pagoId) => {
    try {
      console.log('Obteniendo pago por ID:', pagoId);
      const response = await axios.get(`pagos/${pagoId}`);
      console.log('Pago obtenido:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener pago por ID:', error);
      throw error;
    }
  },

  // Eliminar un pago (si está permitido)
  deletePayment: async (pagoId) => {
    try {
      console.log('Eliminando pago:', pagoId);
      const response = await axios.delete(`pagos/${pagoId}`);
      console.log('Pago eliminado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al eliminar pago:', error);
      throw error;
    }
  },

  // Obtener pagos de una factura específica
  getPaymentsByInvoice: async (facturaId) => {
    try {
      console.log('Obteniendo pagos de factura:', facturaId);
      const response = await axios.get(`pagos/factura/${facturaId}`);
      console.log('Pagos de factura obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener pagos de factura:', error);
      throw error;
    }
  },

  // Crear pago manual (para pagos en efectivo, transferencia, etc.)
  createManualPayment: async (paymentData) => {
    try {
      console.log('Creando pago manual:', paymentData);
      const response = await axios.post('pagos/manual', paymentData);
      console.log('Pago manual creado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear pago manual:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Obtener estadísticas de pagos
  getPaymentStats: async () => {
    try {
      console.log('Obteniendo estadísticas de pagos');
      const response = await axios.get('pagos/stats');
      console.log('Estadísticas de pagos obtenidas:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de pagos:', error);
      throw error;
    }
  },

  // Validar datos de pago antes de procesar
  validatePaymentData: async (paymentData) => {
    try {
      console.log('Validando datos de pago:', paymentData);
      const response = await axios.post('pagos/validate', paymentData);
      console.log('Datos de pago validados:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al validar datos de pago:', error);
      throw error;
    }
  },

  // Obtener métodos de pago disponibles
  getAvailablePaymentMethods: async () => {
    try {
      console.log('Obteniendo métodos de pago disponibles');
      const response = await axios.get('pagos/methods');
      console.log('Métodos de pago obtenidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al obtener métodos de pago:', error);
      throw error;
    }
  }
};

export default payments;
