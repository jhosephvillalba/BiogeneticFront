import axios from './instance';

/**
 * Genera un PDF de informe de Producción Embrionaria
 * @param {number} produccionId - ID de la producción embrionaria
 * @returns {Promise<Blob>} - Blob del archivo PDF generado
 */
export const generarInformeProduccionPdf = async (produccionId) => {
  try {
    const response = await axios.get(`/informes/produccion/${produccionId}/pdf`, {
      responseType: 'blob' // Importante para recibir el PDF como blob
    });
    return response.data;
  } catch (error) {
    console.error('Error al generar informe PDF de producción:', error);
    throw error;
  }
};

/**
 * Descarga un PDF de informe de Producción Embrionaria
 * @param {number} produccionId - ID de la producción embrionaria
 * @param {string} fileName - Nombre del archivo a descargar (opcional)
 */
export const descargarInformeProduccionPdf = async (produccionId, fileName = null) => {
  try {
    const pdfBlob = await generarInformeProduccionPdf(produccionId);
    
    // Crear URL para el blob
    const blobUrl = window.URL.createObjectURL(pdfBlob);
    
    // Crear un elemento <a> temporal para descargar el archivo
    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    
    // Determinar el nombre del archivo
    const nombreArchivo = fileName || `informe_produccion_${produccionId}.pdf`;
    downloadLink.download = nombreArchivo;
    
    // Añadir al DOM, hacer clic y eliminar
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Liberar la URL del objeto
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error al descargar informe PDF de producción:', error);
    throw error;
  }
};

/**
 * Abre un PDF de informe de Producción Embrionaria en una nueva pestaña
 * @param {number} produccionId - ID de la producción embrionaria
 */
export const abrirInformeProduccionPdf = async (produccionId) => {
  try {
    const pdfBlob = await generarInformeProduccionPdf(produccionId);
    
    // Crear URL para el blob
    const blobUrl = window.URL.createObjectURL(pdfBlob);
    
    // Abrir en nueva pestaña
    window.open(blobUrl, '_blank');
    
    // Liberar la URL del objeto después de un tiempo
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('Error al abrir informe PDF de producción:', error);
    throw error;
  }
};

// Exportar todas las funciones
export default {
  generarInformeProduccionPdf,
  descargarInformeProduccionPdf,
  abrirInformeProduccionPdf
};
