import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import { getOutputs } from '../Api/outputs'; // Importamos correctamente el servicio

const Outputs = () => {
  const navigate = useNavigate();
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // State for pagination
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [totalItems, setTotalItems] = useState(0);

  // Función para formatear la fecha al formato ISO
  const formatDate = (dateString) => {
    if (!dateString) return undefined;
    
    try {
      // Crear un objeto Date a partir del string y convertirlo a formato ISO
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return undefined; // Fecha inválida
      
      // Formato ISO 8601: YYYY-MM-DDTHH:mm:ss.sssZ
      return date.toISOString();
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return undefined;
    }
  };

  // Función para cargar las salidas desde la API
  const loadOutputs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Creamos los filtros para la API con el formato correcto
      const filters = {};
      
      if (searchTerm) {
        filters.search_query = searchTerm.trim();
      }
      
      if (startDate) {
        filters.date_from = formatDate(startDate);
      }
      
      if (endDate) {
        filters.date_to = formatDate(endDate);
      }
      
      console.log("Enviando filtros:", filters);
      
      // Parámetros de paginación
      const skip = (currentPage - 1) * itemsPerPage;
      const limit = itemsPerPage;
      
      // Llamamos a la API de filtrado
      const response = await getOutputs(filters, skip, limit);
      
      console.log("Datos de outputs recibidos:", response);
      
      // Determinar la estructura de la respuesta
      let outputItems = [];
      let totalCount = 0;
      
      if (Array.isArray(response)) {
        outputItems = response;
        totalCount = response.length;
      } else if (response && response.items && Array.isArray(response.items)) {
        outputItems = response.items;
        totalCount = response.total || outputItems.length;
      } else if (response && response.results && Array.isArray(response.results)) {
        outputItems = response.results;
        totalCount = response.total || outputItems.length;
      } else if (response && typeof response === 'object') {
        // Si es un solo objeto
        outputItems = [response];
        totalCount = 1;
      }
      
      // Formatear los datos recibidos para el componente
      const formattedOutputs = outputItems.map(output => {
        // Extraer valores considerando diferentes posibles estructuras
        const id = output.id || output.output_id;
        const bullName = output.bull_name || (output.bull && output.bull.name) || 'Sin nombre';
        const client_document = output.client_document;
        const clientName = output.client_name || (output.user && output.user.full_name) || 'Sin cliente';
        const register = output.bull_register || 'Sin registro';
        const quantity = output.quantity_output || output.quantity || '0';
        const date = output.created_at || output.output_date || 'Sin fecha';
        
        return {
          id,
          client: clientName,
          client_document: client_document,
          registration: register,
          name: bullName,
          quantity: typeof quantity === 'number' ? quantity.toFixed(1) : quantity,
          date: date ? new Date(date).toLocaleDateString('es-CO', {
timeZone: 'UTC' }) : 'Sin fecha',
          remark: output.remark || ''
        };
      });
      
      setOutputs(formattedOutputs);
      setTotalItems(totalCount);
      
    } catch (err) {
      console.error("Error al cargar outputs:", err);
      
      // Mostrar mensaje de error más detallado
      if (err.response && err.response.status === 422) {
        setError("Error en los parámetros enviados. Verifique el formato de las fechas.");
      } else {
        setError("No se pudieron cargar los datos. Por favor, intente nuevamente.");
      }
      
      setOutputs([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar datos cuando cambian los filtros o la página
  useEffect(() => {
    loadOutputs();
  }, [currentPage]); // Solo recargamos al cambiar de página, no cuando cambian los filtros

  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault();
    if (validateDates()) {
      setCurrentPage(1); // Reset to first page on new search
      loadOutputs();
    }
  };

  // Validar fechas antes de aplicar filtros
  const validateDates = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        setError("La fecha inicial no puede ser posterior a la fecha final");
        return false;
      }
    }
    return true;
  };

  // Handle view details
  const handleViewDetails = (id) => {
    navigate(`/gestion/inputs/${id}`);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setError(null);
    setCurrentPage(1);
    
    // Cargar datos sin filtros
    loadOutputs();
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container-fluid p-4">
      {/* Mostrar errores si existen */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-4 p-3 bg-light rounded">
        <h4 className="mb-3">Filtrar Salidas</h4>
        <form onSubmit={handleSearch}>
          <div className="row g-3">
            <div className="col-md-6">
              <label htmlFor="searchTerm" className="form-label">Buscar por (CC/NIT/Registro/Lote/Nombre Cliente/Nombre Toro)</label>
              <input
                type="text"
                className="form-control"
                id="searchTerm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ingrese término de búsqueda..."
              />
            </div>
            <div className="col-md-3">
              <label htmlFor="startDate" className="form-label">Fecha Inicial</label>
              <input
                type="date"
                className="form-control"
                id="startDate"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setError(null);
                }}
              />
              <small className="text-muted">Formato: YYYY-MM-DD</small>
            </div>
            <div className="col-md-3">
              <label htmlFor="endDate" className="form-label">Fecha Final</label>
              <input
                type="date"
                className="form-control"
                id="endDate"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError(null);
                }}
              />
              <small className="text-muted">Formato: YYYY-MM-DD</small>
            </div>
          </div>
          <div className="mt-3">
            <button type="submit" className="btn btn-primary">
              <i className="bi bi-search me-2"></i>Buscar
            </button>
            <button 
              type="button" 
              className="btn btn-outline-secondary ms-2"
              onClick={handleClearFilters}
            >
              <i className="bi bi-x-circle me-2"></i>Limpiar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Results Table */}
      <div className="mt-4">
        <h4 className="mb-3">Resultados</h4>
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Documento(Nit/CC)</th>
                    <th>Nombre (Toro)</th>
                    <th>Registro</th>
                    <th>Cantidad</th>
                    <th>Fecha</th>
                    <th>Observaciones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {outputs.length > 0 ? (
                    outputs.map((output) => (
                      <tr key={output.id}>
                        <td>{output.id}</td>
                        <td>{output.client}</td>
                        <td>{output.client_document}</td>
                        <td>{output.name}</td>
                        <td>{output.registration}</td>
                        <td>{output.quantity}</td>
                        <td>{output.date}</td>
                        <td>{output.remark}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleViewDetails(output.id)}
                            title="Ver detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        {error ? (
                          <span className="text-danger">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            Error al cargar datos
                          </span>
                        ) : (
                          <span className="text-muted">
                            <i className="bi bi-inbox me-2"></i>
                            No se encontraron resultados
                          </span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-3">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </button>
                  </li>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => paginate(number)}>
                        {number}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}

            <div className="text-muted text-center mt-2">
              Mostrando {outputs.length} de {totalItems} registros
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Outputs; 