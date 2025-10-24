import axios from './instance.js';

const billing = {
  // Listar facturas con paginación y filtros
  getInvoices: async (filters = {}) => {
    try {
      const { skip = 0, limit = 100, estado, fecha_desde, fecha_hasta } = filters;
      let queryParams = `skip=${skip}&limit=${limit}`;
      
      if (estado) queryParams += `&estado=${estado}`;
      if (fecha_desde) queryParams += `&fecha_desde=${fecha_desde}`;
      if (fecha_hasta) queryParams += `&fecha_hasta=${fecha_hasta}`;
      
      const response = await axios.get(`facturacion/?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw error;
    }
  },

  // Obtener una factura específica por ID
  getInvoiceById: async (facturaId) => {
    try {
      const response = await axios.get(`facturacion/${facturaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener factura:', error);
      throw error;
    }
  },

  // Obtener factura completa con detalles y pagos
  getInvoiceComplete: async (facturaId) => {
    try {
      const response = await axios.get(`facturacion/${facturaId}/completa`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener factura completa:', error);
      throw error;
    }
  },

  // Obtener resumen de una factura
  getInvoiceSummary: async (facturaId) => {
    try {
      const response = await axios.get(`facturacion/${facturaId}/resumen`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener resumen de factura:', error);
      throw error;
    }
  },

  // Obtener detalles de una factura
  getInvoiceDetails: async (facturaId) => {
    try {
      const response = await axios.get(`facturacion/${facturaId}/detalles`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalles de factura:', error);
      throw error;
    }
  },

  // Crear una nueva factura
  createInvoice: async (invoiceData) => {
    try {
      console.log('Enviando datos a /facturacion/ (createInvoice):', invoiceData);
      const response = await axios.post('facturacion/', invoiceData);
      console.log('Respuesta exitosa de createInvoice:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear factura:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  },

  // Crear factura desde formulario con items específicos
  createInvoiceFromForm: async (formData) => {
    try {
      console.log('Enviando datos a /facturacion (createInvoiceFromForm):', formData);
      const response = await axios.post('facturacion', formData);
      console.log('Respuesta exitosa de createInvoiceFromForm:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error al crear factura desde formulario:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      console.error('Error config:', error.config);
      
      // Mostrar más detalles del error
      if (error.response?.data) {
        console.error('Error data details:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  },

  // Actualizar una factura existente
  updateInvoice: async (facturaId, invoiceData) => {
    try {
      const response = await axios.put(`facturacion/${facturaId}`, invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar factura:', error);
      throw error;
    }
  },

  // Eliminar una factura
  deleteInvoice: async (facturaId) => {
    try {
      const response = await axios.delete(`facturacion/${facturaId}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      throw error;
    }
  },

  // Obtener formulario de facturación
  getInvoiceForm: async () => {
    try {
      const response = await axios.get('facturacion/form');
      return response.data;
    } catch (error) {
      console.error('Error al obtener formulario de facturación:', error);
      throw error;
    }
  },

  // Generar PDF de la factura
  generateInvoicePDF: async (facturaId) => {
    try {
      console.log('Generando PDF para factura ID:', facturaId);
      const response = await axios.get(`facturacion/${facturaId}/pdf`, {
        responseType: 'blob' // Importante para archivos binarios
      });
      console.log('PDF generado exitosamente');
      return response.data;
    } catch (error) {
      console.error('Error al generar PDF de la factura:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }
};

export default billing;
