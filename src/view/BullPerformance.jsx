import React, { useState, useEffect, useCallback, useMemo } from "react";
import { searchUsers } from "../Api/users";
import { getBullPerformanceData } from "../Api/bullPerformance";

const BullPerformance = () => {
  // Estado para los filtros
  const [filters, setFilters] = useState({
    client_id: null,
    query: ""
  });

  // Estado para los datos
  const [performanceData, setPerformanceData] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Estado para búsqueda de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Datos de ejemplo para el desarrollo (simulando datos de la API)
  const mockData = [
    {
      id: 1,
      nombre: "VENDAVAL",
      raza: "BR",
      lote: "L001",
      registro: "334455 ICA209GH10",
      donantes_fertilizadas: 752,
      oocitos_civ: 9785,
      porcentaje_produccion: 37,
      client_id: 1,
      client_name: "Cliente Ejemplo 1"
    },
    {
      id: 2,
      nombre: "TORMENTA",
      raza: "AB",
      lote: "L002",
      registro: "445566 ICA209GH11",
      donantes_fertilizadas: 650,
      oocitos_civ: 8200,
      porcentaje_produccion: 42,
      client_id: 2,
      client_name: "Cliente Ejemplo 2"
    },
    {
      id: 3,
      nombre: "FUERZA",
      raza: "BR",
      lote: "L003",
      registro: "556677 ICA209GH12",
      donantes_fertilizadas: 890,
      oocitos_civ: 11200,
      porcentaje_produccion: 35,
      client_id: 1,
      client_name: "Cliente Ejemplo 1"
    }
  ];

  // Cargar clientes
  const loadClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      const searchFilters = {
        role_id: 3, // ID del rol de cliente
        q: clientSearchTerm,
      };

      const response = await searchUsers(searchFilters, 0, 100);
      const clientsList = Array.isArray(response)
        ? response
        : response.items || [];
      setClients(clientsList);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setError("No se pudieron cargar los clientes");
    } finally {
      setLoadingClients(false);
    }
  }, [clientSearchTerm]);

  // Efecto para cargar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearchTerm.trim() !== "") {
        loadClients();
      } else {
        setClients([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearchTerm, loadClients]);

  // Cargar datos de rendimiento desde la API
  const loadPerformanceData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar filtros para la API
      const apiFilters = {
        page: pagination.currentPage,
        page_size: pagination.itemsPerPage
      };

      // Agregar filtro de cliente si está seleccionado
      if (selectedClient && selectedClient.id) {
        apiFilters.client_id = selectedClient.id;
      }

      // Agregar filtro de búsqueda general si existe
      if (filters.query && filters.query.trim()) {
        apiFilters.query = filters.query.trim();
      }

      console.log("Cargando datos con filtros:", apiFilters);
      const response = await getBullPerformanceData(apiFilters);
      console.log("Respuesta de la API:", response);
      
      // Manejar la respuesta de la API
      if (response) {
        // La API puede devolver diferentes estructuras, manejamos ambos casos
        let data = [];
        let total = 0;
        let currentPage = pagination.currentPage;

        if (Array.isArray(response)) {
          // Si la respuesta es directamente un array
          data = response;
          total = response.length;
        } else if (response.data && Array.isArray(response.data)) {
          // Si la respuesta tiene estructura { data: [], total: number, page: number }
          data = response.data;
          total = response.total || response.data.length;
          currentPage = response.page || pagination.currentPage;
        } else if (response.items && Array.isArray(response.items)) {
          // Si la respuesta tiene estructura { items: [], total: number }
          data = response.items;
          total = response.total || response.items.length;
        } else {
          console.warn("Formato de respuesta inesperado:", response);
          data = [];
          total = 0;
        }

        setPerformanceData(data);
        setPagination(prev => ({
          ...prev,
          totalItems: total,
          currentPage: currentPage
        }));
        setUsingMockData(false);
      } else {
        // Si no hay respuesta, usar datos mock
        console.log("No hay respuesta de la API, usando datos mock");
        setPerformanceData(mockData);
        setPagination(prev => ({
          ...prev,
          totalItems: mockData.length,
          currentPage: 1
        }));
        setUsingMockData(true);
      }
    } catch (error) {
      console.error("Error al cargar datos de rendimiento:", error);
      
      // Determinar el tipo de error
      let errorMessage = "Error al cargar los datos de rendimiento";
      if (error.response) {
        // Error de respuesta HTTP
        if (error.response.status === 401) {
          errorMessage = "No tienes permisos para ver estos datos";
        } else if (error.response.status === 404) {
          errorMessage = "No se encontraron datos de rendimiento";
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Fallback a datos mock en caso de error
      console.log("Usando datos mock debido al error");
      setPerformanceData(mockData);
      setPagination(prev => ({
        ...prev,
        totalItems: mockData.length,
        currentPage: 1
      }));
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, filters.query, pagination.currentPage, pagination.itemsPerPage]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (selectedClient || filters.query) {
      // Solo recargar si hay filtros aplicados
      const timer = setTimeout(() => {
        loadPerformanceData();
      }, 500); // Debounce para evitar muchas llamadas

      return () => clearTimeout(timer);
    }
  }, [selectedClient, filters.query]);

  // Recargar datos cuando cambie la página
  useEffect(() => {
    loadPerformanceData();
  }, [pagination.currentPage]);

  // Los datos ya vienen filtrados desde la API, no necesitamos filtrar localmente
  const filteredData = useMemo(() => {
    return [...performanceData];
  }, [performanceData]);

  // Paginar los resultados filtrados
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredData.slice(startIndex, startIndex + pagination.itemsPerPage);
  }, [filteredData, pagination]);

  // Manejar cambio en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      client_id: null,
      query: ""
    });
    setSelectedClient(null);
    setClientSearchTerm("");
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Seleccionar cliente
  const selectClient = (client) => {
    setSelectedClient(client);
    setFilters(prev => ({ ...prev, client_id: client.id }));
    setClientSearchTerm(client.full_name);
    setShowClientDropdown(false);
  };

  return (
    <div className="container-fluid py-4">
      {/* Título */}
      <div className="mb-4">
        <h2 className="mb-3">
          <i className="bi bi-graph-up me-2"></i>
          Bull Performance
        </h2>
        {usingMockData && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Modo de desarrollo:</strong> Se están mostrando datos de ejemplo. Conecta con la API para ver datos reales.
            <button 
              type="button" 
              className="btn-close" 
              data-bs-dismiss="alert" 
              aria-label="Close"
              onClick={() => setUsingMockData(false)}
            ></button>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Filtro por Cliente */}
            <div className="col-md-6">
              <label className="form-label">Cliente</label>
              <div className="position-relative">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar cliente..."
                  value={clientSearchTerm}
                  onChange={(e) => {
                    setClientSearchTerm(e.target.value);
                    setShowClientDropdown(true);
                    if (e.target.value !== selectedClient?.full_name) {
                      setSelectedClient(null);
                      setFilters(prev => ({ ...prev, client_id: null }));
                    }
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                />
                {loadingClients && (
                  <span className="position-absolute top-50 end-0 translate-middle-y me-2">
                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </span>
                )}
                
                {/* Dropdown de clientes */}
                {showClientDropdown && clients.length > 0 && (
                  <div className="position-absolute w-100 bg-white border border-top-0 shadow-sm" style={{ zIndex: 1000 }}>
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="p-2 border-bottom cursor-pointer hover-bg-light"
                        onClick={() => selectClient(client)}
                        style={{ cursor: 'pointer' }}
                      >
                        <strong>{client.full_name}</strong>
                        <br />
                        <small className="text-muted">
                          {client.number_document} | {client.email}
                        </small>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filtro General */}
            <div className="col-md-6">
              <label className="form-label">Búsqueda General</label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre toro, lote o registro..."
                name="query"
                value={filters.query}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          <div className="d-flex justify-content-between mt-3">
            <div>
              {usingMockData && (
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => loadPerformanceData()}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Probar Conexión API
                </button>
              )}
            </div>
            <div>
              <button
                className="btn btn-outline-secondary"
                onClick={clearFilters}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Rendimiento */}
      <div className="table-responsive rounded-3 border">
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th width="15%">Nombre</th>
              <th width="10%">Raza</th>
              <th width="10%">Lote</th>
              <th width="20%">Registro</th>
              <th width="15%"># Donantes Fertilizadas</th>
              <th width="15%"># Oocitos al CIV</th>
              <th width="10%">% Producción</th>
              <th width="5%">Más Info</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-2">Cargando datos de rendimiento...</p>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="8" className="text-center text-danger py-3">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center text-muted py-4">
                  <i className="bi bi-graph-up me-2"></i>
                  {filters.client_id || filters.query
                    ? "No se encontraron datos con esos criterios de filtro"
                    : "No hay datos de rendimiento disponibles"
                  }
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr key={item.id}>
                  <td className="fw-semibold">{item.nombre}</td>
                  <td>{item.raza}</td>
                  <td>{item.lote}</td>
                  <td>{item.registro}</td>
                  <td>{item.donantes_fertilizadas.toLocaleString()}</td>
                  <td>{item.oocitos_civ.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${item.porcentaje_produccion >= 40 ? 'bg-success' : item.porcentaje_produccion >= 30 ? 'bg-warning' : 'bg-danger'}`}>
                      {item.porcentaje_produccion}%
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary"
                      title="Ver más información"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {filteredData.length > pagination.itemsPerPage && (
        <div className="d-flex justify-content-center mt-3">
          <nav aria-label="Paginación de rendimiento">
            <ul className="pagination">
              <li className={`page-item ${pagination.currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  &laquo;
                </button>
              </li>

              {Array.from({
                length: Math.ceil(filteredData.length / pagination.itemsPerPage),
              }).map((_, index) => (
                <li
                  key={`page-${index}`}
                  className={`page-item ${pagination.currentPage === index + 1 ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(index + 1)}
                  >
                    {index + 1}
                  </button>
                </li>
              ))}

              <li className={`page-item ${pagination.currentPage === Math.ceil(filteredData.length / pagination.itemsPerPage) ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === Math.ceil(filteredData.length / pagination.itemsPerPage)}
                >
                  &raquo;
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Resumen de resultados */}
      {filteredData.length > 0 && (
        <div className="mt-3 text-muted">
          <small>
            Mostrando {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredData.length)} de {filteredData.length} registros
          </small>
        </div>
      )}
    </div>
  );
};

export default BullPerformance;
