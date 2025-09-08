import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../Api';

const Admins = () => {
  const navigate = useNavigate();
  
  // Estado para el filtro
  const [filter, setFilter] = useState({
    searchTerm: ''
  });
  
  // Estado para los datos
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Obtener administradores (usuarios con rol de admin)
  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Calculamos el skip para la paginación
      const skip = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const limit = pagination.itemsPerPage;
      
      // Buscamos usuarios con rol admin
      const adminRoleId = 1; // El rol "admin" tiene ID 1
      
      let response;
      
      if (filter.searchTerm) {
        // Si hay término de búsqueda, usamos searchUserss
        const {  searchTerm } = filter; 
        // console.log({serach: searchTerm})
        response = await usersApi.searchUsers({ role_id: adminRoleId, q:searchTerm}, skip, limit);
      } else {
        // Si no hay término de búsqueda, filtramos solo por rol
        response = await usersApi.searchUsers({ role_id: adminRoleId }, skip, limit);
      }
      
      console.log("Respuesta del API para admins:", response);
      
      // Estructura del array puede variar según el API
      const adminList = Array.isArray(response) ? response : [];
      
      setAdmins(adminList);
      setPagination(prev => ({
        ...prev,
        totalItems: response.total || adminList.length
      }));
    } catch (err) {
      console.error("Error al obtener administradores:", err);
      setError(err.response?.data?.detail || "Error al cargar los administradores");
      setAdmins([]);
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
  const handleRowClick = (id) => {
    navigate(`/admin/users/${id}`);
  };

  // Manejar click en botón nuevo
  const handleNewAdmin = () => {
    navigate('/admin/users/new');
  };

  // Efecto para cargar datos
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAdmins();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [filter.searchTerm, pagination.currentPage]);

  return (
    <div className="container-fluid py-4 admins-view">
      {/* Título y filtro */}
      <div className="mb-4">
        <h2 className="mb-3">
          <i className="bi bi-people-fill me-2"></i>
          Gestión de Administradores
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
                onClick={fetchAdmins}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <i className="bi bi-arrow-clockwise"></i>
                )}
              </button>
            </div>
          </div>
          <div className="col-md-4 text-end">
            <button 
              className="btn btn-primary" 
              onClick={handleNewAdmin}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Administrador
            </button>
          </div>
        </div>
      </div>
      
      {/* Tabla de administradores */}
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
            {loading ? (
              <tr>
                <td colSpan="4" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Buscando administradores...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="text-center text-danger py-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center text-muted py-4">
                  <i className="bi bi-people me-2"></i>
                  {filter.searchTerm ? 
                    'No se encontraron administradores con ese criterio' : 
                    'No hay administradores registrados'}
                </td>
              </tr>
            ) : (
              admins.map(admin => (
                <tr 
                  key={admin.id}
                  onClick={() => handleRowClick(admin.id)}
                  className="cursor-pointer"
                >
                  <td className="fw-semibold">#{admin.id}</td>
                  <td>{admin.number_document || 'Sin documento'}</td>
                  <td>{admin.full_name || 'Sin nombre'}</td>
                  <td>{admin.email || 'Sin correo'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      {admins.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="small text-muted">
            Mostrando {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} a{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} de{' '}
            {pagination.totalItems} administradores
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
      <style jsx>{`
        .admins-view {
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

export default Admins; 