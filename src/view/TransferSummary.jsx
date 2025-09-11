import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTransferencias } from '../Api/transferencias.js';

const TransferSummary = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [transferencias, setTransferencias] = useState([]);
  const [selectedTransferencia, setSelectedTransferencia] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  // Cargar todas las transferencias al iniciar
  useEffect(() => {
    loadAllTransferencias();
  }, []);

  // Función para cargar todas las transferencias
  const loadAllTransferencias = async (page = 1, search = null) => {
    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * pagination.itemsPerPage;
      const response = await getAllTransferencias(skip, pagination.itemsPerPage, search);
      
      // Manejar diferentes formatos de respuesta
      let transferenciasData = [];
      let totalItems = 0;
      
      if (response.items && Array.isArray(response.items)) {
        transferenciasData = response.items;
        totalItems = response.total || response.items.length;
      } else if (Array.isArray(response)) {
        transferenciasData = response;
        totalItems = response.length;
      } else if (response.data && Array.isArray(response.data)) {
        transferenciasData = response.data;
        totalItems = response.total || response.data.length;
      }

      setTransferencias(transferenciasData);
      
      const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalPages,
        totalItems
      }));

    } catch (err) {
      console.error('Error cargando transferencias:', err);
      setError('Error al cargar transferencias.');
      setTransferencias([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar transferencias cuando cambia el término de búsqueda
  useEffect(() => {
    const searchTransferencias = async () => {
      const searchValue = searchTerm.trim();
      if (searchValue.length === 0) {
        // Si no hay término de búsqueda, cargar todas las transferencias
        loadAllTransferencias(1, null);
      } else if (searchValue.length >= 3) {
        // Si hay al menos 3 caracteres, hacer búsqueda
        loadAllTransferencias(1, searchValue);
      }
    };

    const debounceTimer = setTimeout(searchTransferencias, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedTransferencia(null);
    loadAllTransferencias(1, null);
  };

  const handlePageChange = (page) => {
    const searchValue = searchTerm.trim();
    const searchQuery = searchValue.length >= 3 ? searchValue : null;
    loadAllTransferencias(page, searchQuery);
  };

  const handleViewDetail = (transferencia) => {
    navigate(`/transfer-detail/${transferencia.id}`);
  };

  const handleBack = () => {
    setSelectedTransferencia(null);
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Si hay una transferencia seleccionada, mostrar vista detallada
  if (selectedTransferencia) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h2 mb-0">Detalle de Transferencia</h1>
          <button 
            className="btn btn-outline-secondary"
            onClick={handleBack}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver al listado
          </button>
        </div>

        {/* Información del cliente */}
        <div className="card mb-4">
          <div className="card-body">
            <h2 className="h5 card-title">Información del Cliente y Transferencia</h2>
            <div className="row">
              <div className="col-md-4">
                <p className="mb-1"><strong>Cliente:</strong> {selectedTransferencia.cliente_nombre || 'No disponible'}</p>
                <p className="mb-1"><strong>Email:</strong> {selectedTransferencia.cliente_email || 'No disponible'}</p>
                <p className="mb-0"><strong>Documento:</strong> {selectedTransferencia.cliente_documento || 'No disponible'}</p>
              </div>
              <div className="col-md-4">
                <p className="mb-1"><strong>Fecha de transferencia:</strong> {formatDate(selectedTransferencia.fecha_transferencia)}</p>
                <p className="mb-1"><strong>Veterinario:</strong> {selectedTransferencia.veterinario_responsable}</p>
                <p className="mb-0"><strong>Fecha:</strong> {formatDate(selectedTransferencia.fecha)}</p>
              </div>
              <div className="col-md-4">
                <p className="mb-1"><strong>Lugar:</strong> {selectedTransferencia.lugar}</p>
                <p className="mb-1"><strong>Finca:</strong> {selectedTransferencia.finca}</p>
                <p className="mb-0"><strong>Observación:</strong> {selectedTransferencia.observacion}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de reportes */}
        <div className="card">
          <div className="card-body">
            <h2 className="h5 card-title mb-4">Registros de Transferencia</h2>
            {selectedTransferencia.reportes && selectedTransferencia.reportes.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Donadora</th>
                      <th>Raza</th>
                      <th>Toro</th>
                      <th>Raza del Toro</th>
                      <th>Estado</th>
                      <th>Receptora</th>
                      <th>Horario</th>
                      <th>DX</th>
                      <th>DXX</th>
                      <th>DXXX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTransferencia.reportes.map((reporte, index) => (
                      <tr key={transfer.id || `transfer-summary-${index}`}>
                        <td>{index + 1}</td>
                        <td>{reporte.donadora}</td>
                        <td>{reporte.raza_donadora}</td>
                        <td>{reporte.toro}</td>
                        <td>{reporte.toro_raza}</td>
                        <td>{reporte.estado}</td>
                        <td>{reporte.receptora}</td>
                        <td>{reporte.horario}</td>
                        <td>{reporte.dx}</td>
                        <td>{reporte.dxx}</td>
                        <td>{reporte.dxxx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="alert alert-info">
                No hay reportes disponibles para esta transferencia.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista principal con búsqueda y listado
  return (
    <div className="container-fluid mt-4">
      <h1 className="h2 mb-4">Resumen de Transferencias</h1>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Búsqueda de transferencias */}
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5 card-title">Buscar Transferencias</h2>
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por documento, nombre o correo del cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="btn btn-outline-secondary"
                type="button"
                onClick={handleClearSearch}
                title="Limpiar búsqueda"
              >
                <i className="bi bi-x"></i>
              </button>
            )}
            {loading && (
              <span className="input-group-text">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </span>
            )}
          </div>
          
          {searchTerm && searchTerm.length >= 3 && (
            <div className="alert alert-info">
              <small>
                <i className="bi bi-search me-1"></i>
                Buscando: "{searchTerm}"
              </small>
            </div>
          )}
        </div>
      </div>

      {/* Lista de transferencias */}
      <div className="card">
        <div className="card-body">
          <h2 className="h5 card-title mb-4">
            {searchTerm && searchTerm.length >= 3 ? 'Resultados de la Búsqueda' : 'Todas las Transferencias'}
            <small className="text-muted ms-2">
              ({pagination.totalItems} registros)
            </small>
          </h2>
          
          {loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando transferencias...</span>
              </div>
            </div>
          ) : transferencias.length === 0 ? (
            <div className="alert alert-info">
              {searchTerm && searchTerm.length >= 3 
                ? `No se encontraron transferencias que coincidan con "${searchTerm}".`
                : 'No hay transferencias registradas en el sistema.'
              }
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Fecha de Transferencia</th>
                      <th>Veterinario</th>
                      <th>Lugar</th>
                      <th>Finca</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferencias.map(transferencia => (
                      <tr key={transferencia.id}>
                        <td>{transferencia.id}</td>
                        <td>{transferencia.cliente_nombre || 'No especificado'}</td>
                        <td>{formatDate(transferencia.fecha_transferencia)}</td>
                        <td>{transferencia.veterinario_responsable}</td>
                        <td>{transferencia.lugar}</td>
                        <td>{transferencia.finca}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleViewDetail(transferencia)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <nav aria-label="Paginación de transferencias" className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                      const page = index + 1;
                      return (
                        <li key={page} className={`page-item ${pagination.currentPage === page ? 'active' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}
                    
                    <li className={`page-item ${pagination.currentPage === pagination.totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link"
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                  
                  <div className="text-center">
                    <small className="text-muted">
                      Página {pagination.currentPage} de {pagination.totalPages} 
                      ({pagination.totalItems} registros en total)
                    </small>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferSummary; 