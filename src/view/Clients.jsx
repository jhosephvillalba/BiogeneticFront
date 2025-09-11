import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../Api';

const Clients = () => {
  const navigate = useNavigate();
  
  // Estado para el filtro
  const [filter, setFilter] = useState({
    searchTerm: ''
  });
  
  // Estado para los datos
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Obtener clientes (usuarios con rol client)
  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculamos el skip para la paginación
      const skip = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const limit = pagination.itemsPerPage;
      
      // Buscamos usuarios con rol client (ID 3)
      const clientRoleId = 3; // El rol "client" tiene ID 3
      
      let response;
      
      if (filter.searchTerm) {
        // Si hay término de búsqueda, usamos searchUsers
        const {searchTerm} = filter;
         response = await usersApi.searchUsers({ role_id: clientRoleId, q: searchTerm }, skip, limit);
        // response = await usersApi.searchUsers(filter, skip, limit);
      } else {
        // Si no hay término de búsqueda, filtramos solo por rol
        response = await usersApi.searchUsers({ role_id: clientRoleId }, skip, limit);
      }
      
      console.log("Respuesta del API para clientes:", response);
      
      // Estructura del array puede variar según el API
      const clientList = Array.isArray(response) ? response : [];
      
      setClients(clientList);
      setPagination(prev => ({
        ...prev,
        totalItems: response.total || clientList.length
      }));
    } catch (err) {
      console.error("Error al obtener clientes:", err);
      setError(err.response?.data?.detail || "Error al cargar los clientes");
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio en filtro
  const handleFilterChange = (e) => {
    const { value } = e.target;
    setFilter({ searchTerm: value });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Manejar click en fila
  const handleRowClick = useCallback((id) => {
    navigate(`/users/clients/${id}`);
  }, [navigate]);

  // Memoizar el contenido de la tabla
  const tableContent = useMemo(() => {
    if (loading) {
      return (
        <tr key="loading-row">
          <td colSpan="4" className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="mt-2">Buscando clientes...</p>
          </td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr key="error-row">
          <td colSpan="4" className="text-center text-danger py-3">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </td>
        </tr>
      );
    }

    if (clients.length === 0) {
      return (
        <tr key="no-data-row">
          <td colSpan="4" className="text-center text-muted py-4">
            <i className="bi bi-people me-2"></i>
            {filter.searchTerm ? 
              'No se encontraron clientes con ese criterio' : 
              'No hay clientes registrados'}
          </td>
        </tr>
      );
    }

    return clients.map(client => (
      <tr 
        key={client.id}
        onClick={() => handleRowClick(client.id)}
        className="cursor-pointer"
      >
        <td className="fw-semibold">#{client.id}</td>
        <td>{client.number_document || 'Sin documento'}</td>
        <td>{client.full_name || 'Sin nombre'}</td>
        <td>{client.email || 'Sin correo'}</td>
      </tr>
    ));
  }, [loading, error, clients, filter.searchTerm, handleRowClick]);

  // Manejar click en botón nuevo
  const handleNewClient = () => {
    navigate('/users/clients/new');
  };

  // Efecto para cargar datos
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filter.searchTerm, pagination.currentPage]);

  return (
    <div className="container-fluid py-4 clients-view">
      {/* Título y filtro */}
      <div className="mb-4">
        <h2 className="mb-3">
          <i className="bi bi-people-fill me-2"></i>
          Gestión de Clientes
        </h2>
        
        <div className="row">
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por documento, nombre o correo..."
                value={filter.searchTerm}
                onChange={handleFilterChange}
              />
              <button 
                className="btn btn-outline-secondary" 
                type="button"
                onClick={fetchClients}
                disabled={loading}
              >
                {loading ? (
                  <span key="loading-spinner" className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i key="refresh-icon" className="bi bi-arrow-clockwise"></i>
                )}
              </button>
            </div>
          </div>
          <div className="col-md-4 text-end">
            <button 
              className="btn btn-primary" 
              onClick={handleNewClient}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Cliente
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabla de clientes */}
      <div className="table-responsive rounded-3 border">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th width="10%">ID</th>
              <th width="25%">Documento</th>
              <th width="35%">Nombre</th>
              <th width="30%">Correo</th>
            </tr>
          </thead>
          <tbody>
            {tableContent}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      {clients.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small text-muted">
            Mostrando {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} a{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de{' '}
            {pagination.totalItems} clientes
          </div>
          
          <nav>
            <ul className="pagination mb-0">
              <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
              </li>
              
              {Array.from({ length: Math.ceil(pagination.totalItems / pagination.itemsPerPage) }, (_, i) => (
                <li 
                  key={i + 1} 
                  className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                >
                  <button 
                    className="page-link" 
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: i + 1 }))}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
              
              <li className={`page-item ${pagination.currentPage * pagination.itemsPerPage >= pagination.totalItems ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                >
                  <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Estilos personalizados */}
      <style>{`
        .clients-view {
          background-color: #f8fafc;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: #6c757d;
          border-bottom: 2px solid #dee2e6;
        }
        .rounded-3 {
          border-radius: 0.5rem !important;
        }
      `}</style>
    </div>
  );
};

export default Clients;