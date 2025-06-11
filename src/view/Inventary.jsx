import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInputs, filterInputs } from '../Api/inputs';

const Inventory = () => {
  const navigate = useNavigate();
  
  // Estado para los filtros y datos
  const [filters, setFilters] = useState({
    searchQuery: '',
    dateFrom: '',
    dateTo: '',
    status: 'all',
  });
  
  // Estado para los datos y paginación
  const [entries, setEntries] = useState([]);
  // const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });
  const [hasSearched, setHasSearched] = useState(false);

  // Función para cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        // Usar filterInputs en lugar de getInputs para obtener datos completos
        const response = await filterInputs({}, 0, pagination.itemsPerPage);
        console.log("Datos de entradas iniciales:", response);
        
        if (Array.isArray(response)) {
          setEntries(response);
          setPagination(prev => ({ ...prev, totalItems: response.length }));
        } else if (response && response.items) {
          setEntries(response.items);
          setPagination(prev => ({ ...prev, totalItems: response.total || response.items.length }));
        }
        
        setHasSearched(true);
      } catch (err) {
        console.error("Error al cargar datos iniciales:", err);
        setError("No se pudieron cargar los datos. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Función para formatear fecha para la API
  const formatApiDateParam = (dateString) => {
    if (!dateString) return null;
    
    try {
      // Asegurarse de que la fecha tenga el formato correcto
      let date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // Si es YYYY-MM-DD, agregar tiempo para evitar problemas de zona horaria
        date = new Date(dateString + 'T00:00:00');
      }
      
      if (isNaN(date.getTime())) return null;
      
      // Formatear como YYYY-MM-DD
      return date.toISOString(); 
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return null;
    }
  };

  // Función para traducir estado del español al inglés
  const getStatusInEnglish = (spanishStatus) => {
    switch (spanishStatus?.trim()) {
      case 'Pendiente': return 'pending';
      case 'En Proceso': return 'processing';
      case 'Completado': return 'completed';
      case 'Cancelado': return 'cancelled';
      default: return spanishStatus?.toLowerCase() || '';
    }
  };

  // Función para obtener color del estado
  const getStatusColor = (spanishStatus) => {
    const status = getStatusInEnglish(spanishStatus);
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // // Función para aplicar filtros localmente
  // const applyLocalFilters = (data) => {
  //   if (!data) return [];
    
  //   return data.filter(entry => {
  //     // Filtrar por estado si no es 'all'
  //     if (filters.status !== 'all') {
  //       const entryStatus = getStatusInEnglish(entry.status);
  //       return entryStatus === filters.status;
  //     }
  //     return true;
  //   });
  // };

// Modificar fetchFilteredData para incluir validación adicional
const fetchFilteredData = async () => {
  const { searchQuery, dateFrom, dateTo, status} = filters;
  setLoading(true);
  setError(null);
  
  try {
    const skip = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const limit = pagination.itemsPerPage;
    
    const filterParams = {};
    
    if (searchQuery?.trim()) {
      filterParams.search_query = searchQuery.trim();
    }

    console.log("Status:", status);

    if (status !== 'all') {
      
      filterParams.status = status;
    }
    
    // Solo incluir fechas si ambas están presentes
    if (dateFrom && dateTo) {
      const formattedDateFrom = formatApiDateParam(dateFrom);
      const formattedDateTo = formatApiDateParam(dateTo);
      
      if (formattedDateFrom && formattedDateTo) {
        filterParams.date_from = formattedDateFrom;
        filterParams.date_to = formattedDateTo;
      }
    }
    
    console.log("Filtros a enviar:", filterParams);
    
    const response = await filterInputs(filterParams, skip, limit);
    console.log("Respuesta de filtros:", response);
    
    let newEntries = [];
    if (Array.isArray(response)) {
      newEntries = response;
    } else if (response && response.items) {
      newEntries = response.items;
    }

    // const filteredData = applyLocalFilters(newEntries);
    
    setEntries(newEntries);
    // setFilteredEntries(filteredData);
    setPagination(prev => ({ 
      ...prev, 
      totalItems: entries.length 
    }));
    
    setHasSearched(true);
  } catch (err) {
    console.error("Error al filtrar:", err);
    setError(err.response?.data?.detail || "Error al aplicar los filtros");
    setEntries([]);
    // setFilteredEntries([]);
  } finally {
    setLoading(false);
  }
};

  // Efecto para aplicar filtros locales cuando cambia el estado
  useEffect(() => {
    // const filteredData = applyLocalFilters(entries);
    // setFilteredEntries(filteredData);
    setPagination(prev => ({ 
      ...prev, 
      totalItems: entries.length,
      currentPage: 1 // Reset a la primera página cuando cambian los filtros
    }));
  }, [filters.status, entries]);

  // Actualizar handleFilterChange para manejar cambios inmediatos en el filtro de estado
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Aplicar filtros al hacer clic en el botón de buscar
// Modificar handleSearch para validar fechas
const handleSearch = (e) => {
  e.preventDefault();
  
  // Validación mejorada de fechas
  if (filters.dateFrom || filters.dateTo) {
    if (!filters.dateFrom || !filters.dateTo) {
      setError("Debe especificar ambas fechas para filtrar por rango");
      return;
    }
    
    const fromDate = new Date(filters.dateFrom);
    const toDate = new Date(filters.dateTo);
    
    if (fromDate > toDate) {
      setError("La fecha 'Desde' no puede ser mayor que la fecha 'Hasta'");
      return;
    }
  }

  setPagination(prev => ({ ...prev, currentPage: 1 }));
  setError(null);
  fetchFilteredData();
};

  // Resetear filtros
  const handleReset = () => {
    setFilters({
      searchQuery: '',
      dateFrom: '',
      dateTo: '',
      status: 'all'
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    
    const loadInitial = async () => {
      setLoading(true);
      try {
        const response = await filterInputs({}, 0, pagination.itemsPerPage);
        
        let newEntries = [];
        if (Array.isArray(response)) {
          newEntries = response;
        } else if (response && response.items) {
          newEntries = response.items;
        }
        
        setEntries(newEntries);
        // setFilteredEntries(newEntries); // Con status 'all', todos los entries son visibles
        setPagination(prev => ({ 
          ...prev, 
          totalItems: newEntries.length 
        }));
      } catch (err) {
        console.error("Error al recargar datos:", err);
        setError("No se pudieron cargar los datos. Intente nuevamente.");
        setEntries([]);
        // setFilteredEntries([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitial();
  };

  // Función para manejar el refresh
  const handleRefresh = () => {
    fetchFilteredData();
  };

  // Actualizar handlePageChange para usar los datos filtrados
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  // Manejar clic en fila
  const handleRowClick = (id) => {
    navigate(`/gestion/inputs/${id}`);
  };

  // Función para formatear fecha en formato legible
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };



  return (
    <div className="container-fluid py-4 inventory-view">
      {/* Encabezado */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-0">
            <i className="bi bi-box-seam me-2"></i>
            Gestión de Entradas
          </h2>
          <small className="text-muted">Administración de entradas de material genético</small>
        </div>
        <div>
          {/* <button 
            className="btn btn-success me-2"
            onClick={() => navigate('/gestion/inputs/new')}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Nueva Entrada
          </button> */}
          <button 
            className="btn btn-outline-primary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <i className={`bi bi-arrow-clockwise ${loading ? 'd-none' : ''}`}></i>
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : 'Actualizar'}
          </button>
        </div>
      </div>
      
      {/* Panel de Filtros */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Filtros de Búsqueda
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSearch}>
            <div className="row g-3">
              <div className="col-md-4">
                <label htmlFor="searchQuery" className="form-label small fw-bold">Búsqueda</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    id="searchQuery"
                    name="searchQuery"
                    className="form-control"
                    placeholder="Buscar por toro, lote o código..."
                    value={filters.searchQuery}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="col-md-2">
                <label htmlFor="dateFrom" className="form-label small fw-bold">Desde</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-calendar"></i>
                  </span>
                  <input
                    type="date"
                    id="dateFrom"
                    name="dateFrom"
                    className="form-control"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="col-md-2">
                <label htmlFor="dateTo" className="form-label small fw-bold">Hasta</label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-calendar"></i>
                  </span>
                  <input
                    type="date"
                    id="dateTo"
                    name="dateTo"
                    className="form-control"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="col-md-2">
                <label htmlFor="status" className="form-label small fw-bold">Estado</label>
                <select
                  id="status"
                  name="status"
                  className="form-select"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="all">Todos</option>
                  <option value="pending">Pendiente</option>
                  <option value="processing">En Proceso</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              <div className="col-md-2 d-flex align-items-end">
                <div className="d-flex gap-2 w-100">
                  <button 
                    type="submit" 
                    className="btn btn-primary flex-grow-1"
                  >
                    <i className="bi bi-search me-1"></i>
                    Buscar
                  </button>
                  <button 
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleReset}
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Resultados */}
      <div className="card shadow-sm">
        <div className="card-header bg-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-list-ul me-2"></i>
            Entradas Registradas
          </h5>
          {hasSearched && !loading && entries.length > 0 && (
            <span className="badge bg-primary rounded-pill">
              {pagination.totalItems} registros
            </span>
          )}
        </div>
        
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Toro</th>
                  <th>Cliente</th>
                  <th>Documento</th>
                  <th>Fecha</th>
                  <th>Cantidad Recibida</th>
                  <th>Disponible</th>
                  <th>Lote</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="mt-2">Cargando entradas...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="9" className="text-center text-danger py-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {typeof error === 'string' ? error : 'Error al cargar los datos'}
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-muted py-4">
                      <i className="bi bi-database-exclamation me-2"></i>
                      No se encontraron entradas con los filtros aplicados
                    </td>
                  </tr>
                ) : (
                  entries.map(entry => (
                    <tr 
                      key={entry.id} 
                      onClick={() => handleRowClick(entry.id)}
                      className="cursor-pointer"
                    >
                      <td className="fw-semibold">#{entry.id}</td>
                      <td>
                        <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">
                          {entry.bull?.name || entry.bull_name || `Toro #${entry.bull_id}` || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info rounded-pill">
                          {entry.user?.full_name || entry.client_name || entry.client?.full_name || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-dark bg-opacity-10 text-dark">
                          {entry.user?.number_document || entry.client_document || entry.client?.number_document || 'N/A'}
                        </span>
                      </td>
                      <td>{formatDate(entry.created_at)}</td>
                      <td className="fw-semibold">{parseFloat(entry.quantity_received || 0).toFixed(1)}</td>
                      <td>
                        <span className={parseFloat(entry.total || 0) <= 0 ? 'text-danger fw-bold' : 'text-success'}>
                          {parseFloat(entry.total || 0).toFixed(1)}
                          {parseFloat(entry.total || 0) <= 0 && 
                            <span className="badge bg-danger ms-2">Agotado</span>
                          }
                        </span>
                      </td>
                      <td>{entry.lote || entry.lote || 'N/A'}</td>
                      <td>
                        <span className={`badge bg-${getStatusColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Paginación */}
        {hasSearched && !loading && entries.length > 0 && (
          <div className="card-footer bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div className="small text-muted">
                Mostrando {Math.min(entries.length, 1)} a{' '}
                {Math.min(entries.length, pagination.itemsPerPage)} de{' '}
                {pagination.totalItems} entradas
              </div>
              
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  
                  {Array.from({ length: Math.ceil(pagination.totalItems / pagination.itemsPerPage) || 1 }, (_, i) => (
                    <li 
                      key={i + 1} 
                      className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                    >
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  
                  <li className={`page-item ${pagination.currentPage * pagination.itemsPerPage >= pagination.totalItems ? 'disabled' : ''}`}>
                    <button 
                      className="page-link" 
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Estilos personalizados */}
      <style jsx>{`
        .inventory-view {
          background-color: #f8fafc;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .card {
          border-radius: 0.5rem;
          border: none;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
        }
        .table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: #6c757d;
          border-bottom: 2px solid #dee2e6;
        }
        .badge {
          padding: 0.35em 0.65em;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default Inventory;