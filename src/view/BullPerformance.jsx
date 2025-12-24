import React, { useState, useEffect, useCallback, useMemo, startTransition } from "react";
import { searchUsers } from "../Api/users";
import { getBullPerformanceData } from "../Api/bullPerformance";
import { getRaces } from "../Api/races";

const BullPerformance = () => {
  // Estado para los filtros
  const [filters, setFilters] = useState({
    client_id: null,
    raza_id: null,
    query: ""
  });

  // Estado para los datos
  const [performanceData, setPerformanceData] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [summaryStats, setSummaryStats] = useState(null);

  // Estado para búsqueda de clientes
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Estado para razas
  const [races, setRaces] = useState([]);
  const [loadingRaces, setLoadingRaces] = useState(false);
  const [selectedRace, setSelectedRace] = useState(null);

  // Función para normalizar datos de la API
  const normalizeApiData = (rawData) => {
    if (!rawData) return [];
    
    return rawData.map((item, index) => ({
      id: item.id || `bull-${index}`,
      nombre: item.toro || 'Sin nombre',
      raza: item.raza || 'N/A',
      lote: item.lote || 'N/A',
      registro: item.registro || 'N/A',
      donantes_fertilizadas: Number(item.donantes_fertilizadas || 0),
      oocitos_civ: Number(item.ovocitos_civ || 0),
      porcentaje_produccion: Number(item.porcentaje_produccion || 0),
      client_id: item.client_id || null,
      client_name: item.client_name || 'Cliente desconocido'
    }));
  };

  // Paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 15,
    totalItems: 0,
    hasMore: true
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
    },
    {
      id: 4,
      nombre: "RAYO",
      raza: "BR",
      lote: "L004",
      registro: "667788 ICA209GH13",
      donantes_fertilizadas: 720,
      oocitos_civ: 9500,
      porcentaje_produccion: 45,
      client_id: 3,
      client_name: "Cliente Ejemplo 3"
    },
    {
      id: 5,
      nombre: "ESTRELLA",
      raza: "AB",
      lote: "L005",
      registro: "778899 ICA209GH14",
      donantes_fertilizadas: 680,
      oocitos_civ: 8800,
      porcentaje_produccion: 38,
      client_id: 2,
      client_name: "Cliente Ejemplo 2"
    },
    {
      id: 6,
      nombre: "TRUENO",
      raza: "BR",
      lote: "L006",
      registro: "889900 ICA209GH15",
      donantes_fertilizadas: 920,
      oocitos_civ: 11500,
      porcentaje_produccion: 41,
      client_id: 1,
      client_name: "Cliente Ejemplo 1"
    },
    {
      id: 7,
      nombre: "VIENTO",
      raza: "AB",
      lote: "L007",
      registro: "990011 ICA209GH16",
      donantes_fertilizadas: 580,
      oocitos_civ: 7800,
      porcentaje_produccion: 33,
      client_id: 3,
      client_name: "Cliente Ejemplo 3"
    },
    {
      id: 8,
      nombre: "SOL",
      raza: "BR",
      lote: "L008",
      registro: "001122 ICA209GH17",
      donantes_fertilizadas: 850,
      oocitos_civ: 10200,
      porcentaje_produccion: 39,
      client_id: 2,
      client_name: "Cliente Ejemplo 2"
    },
    {
      id: 9,
      nombre: "LUNA",
      raza: "AB",
      lote: "L009",
      registro: "112233 ICA209GH18",
      donantes_fertilizadas: 740,
      oocitos_civ: 9200,
      porcentaje_produccion: 44,
      client_id: 1,
      client_name: "Cliente Ejemplo 1"
    },
    {
      id: 10,
      nombre: "MAR",
      raza: "BR",
      lote: "L010",
      registro: "223344 ICA209GH19",
      donantes_fertilizadas: 690,
      oocitos_civ: 8600,
      porcentaje_produccion: 36,
      client_id: 3,
      client_name: "Cliente Ejemplo 3"
    },
    {
      id: 11,
      nombre: "MONTAÑA",
      raza: "AB",
      lote: "L011",
      registro: "334455 ICA209GH20",
      donantes_fertilizadas: 810,
      oocitos_civ: 9800,
      porcentaje_produccion: 42,
      client_id: 2,
      client_name: "Cliente Ejemplo 2"
    },
    {
      id: 12,
      nombre: "RIO",
      raza: "BR",
      lote: "L012",
      registro: "445566 ICA209GH21",
      donantes_fertilizadas: 760,
      oocitos_civ: 9400,
      porcentaje_produccion: 40,
      client_id: 1,
      client_name: "Cliente Ejemplo 1"
    },
    {
      id: 13,
      nombre: "VOLCAN",
      raza: "AB",
      lote: "L013",
      registro: "556677 ICA209GH22",
      donantes_fertilizadas: 820,
      oocitos_civ: 10100,
      porcentaje_produccion: 43,
      client_id: 2,
      client_name: "Cliente Ejemplo 2"
    },
    {
      id: 14,
      nombre: "CASCADA",
      raza: "BR",
      lote: "L014",
      registro: "667788 ICA209GH23",
      donantes_fertilizadas: 730,
      oocitos_civ: 8900,
      porcentaje_produccion: 37,
      client_id: 3,
      client_name: "Cliente Ejemplo 3"
    },
    {
      id: 15,
      nombre: "BOSQUE",
      raza: "AB",
      lote: "L015",
      registro: "778899 ICA209GH24",
      donantes_fertilizadas: 680,
      oocitos_civ: 8200,
      porcentaje_produccion: 35,
      client_id: 1,
      client_name: "Cliente Ejemplo 1"
    },
    {
      id: 16,
      nombre: "DESIERTO",
      raza: "BR",
      lote: "L016",
      registro: "889900 ICA209GH25",
      donantes_fertilizadas: 790,
      oocitos_civ: 9600,
      porcentaje_produccion: 41,
      client_id: 2,
      client_name: "Cliente Ejemplo 2"
    },
    {
      id: 17,
      nombre: "GLACIAR",
      raza: "AB",
      lote: "L017",
      registro: "990011 ICA209GH26",
      donantes_fertilizadas: 710,
      oocitos_civ: 8800,
      porcentaje_produccion: 38,
      client_id: 3,
      client_name: "Cliente Ejemplo 3"
    },
    {
      id: 18,
      nombre: "OCEANO",
      raza: "BR",
      lote: "L018",
      registro: "001122 ICA209GH27",
      donantes_fertilizadas: 860,
      oocitos_civ: 10300,
      porcentaje_produccion: 44,
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

  // Cargar razas al montar el componente
  const loadRaces = useCallback(async () => {
    try {
      setLoadingRaces(true);
      const response = await getRaces(0, 1000);
      // La API puede devolver un array directamente o dentro de un objeto
      const racesList = Array.isArray(response) 
        ? response 
        : response.items || response.data || [];
      setRaces(racesList);
    } catch (error) {
      console.error("Error al cargar razas:", error);
      setError("No se pudieron cargar las razas");
    } finally {
      setLoadingRaces(false);
    }
  }, []);

  // Cargar razas al montar el componente
  useEffect(() => {
    loadRaces();
  }, [loadRaces]);

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
      } else if (filters.client_id) {
        apiFilters.client_id = filters.client_id;
      }

      // Agregar filtro de raza si está seleccionada
      if (selectedRace && selectedRace.id) {
        apiFilters.raza_id = selectedRace.id;
      } else if (filters.raza_id) {
        apiFilters.raza_id = filters.raza_id;
      }

      // Agregar filtro de búsqueda general si existe
      if (filters.query && filters.query.trim()) {
        apiFilters.query = filters.query.trim();
      }

      console.log("Cargando datos con filtros:", apiFilters);
      console.log("URL que se enviará:", `/bull-performance/?${new URLSearchParams(apiFilters).toString()}`);
      const response = await getBullPerformanceData(apiFilters);
      console.log("Respuesta de la API:", response);
      
      // Log detallado de la estructura de datos
      if (response && response.data) {
        console.log("Estructura de datos:", {
          isArray: Array.isArray(response.data),
          length: Array.isArray(response.data) ? response.data.length : 'N/A',
          firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : 'No items'
        });
      }
      
      // Manejar la respuesta de la API
      if (response) {
        // La API puede devolver diferentes estructuras, manejamos ambos casos
        let data = [];
        let total = 0;
        let currentPage = pagination.currentPage;

        if (Array.isArray(response)) {
          // Si la respuesta es directamente un array
          data = normalizeApiData(response);
          total = response.length;
        } else if (response.data && Array.isArray(response.data)) {
          // Si la respuesta tiene estructura { data: [], total_records: number, page: number, page_size: number }
          data = normalizeApiData(response.data);
          total = response.total_records || response.data.length;
          currentPage = response.page || pagination.currentPage;
        } else if (response.items && Array.isArray(response.items)) {
          // Si la respuesta tiene estructura { items: [], total: number }
          data = normalizeApiData(response.items);
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
          currentPage: currentPage,
          hasMore: data.length === pagination.itemsPerPage // Si recibimos menos de 15, no hay más páginas
        }));
        setSummaryStats(response.summary || null);
        setUsingMockData(false);
      } else {
        // Si no hay respuesta, usar datos mock
        console.log("No hay respuesta de la API, usando datos mock");
        setPerformanceData(mockData);
        setPagination(prev => ({
          ...prev,
          totalItems: mockData.length,
          currentPage: 1,
          hasMore: false // En modo mock, no hay más páginas
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
      
      // Fallback a datos mock en caso de error - Agrupado con startTransition
      console.log("Usando datos mock debido al error");
      startTransition(() => {
        setPerformanceData(mockData);
        setPagination(prev => ({
          ...prev,
          totalItems: mockData.length,
          currentPage: 1,
          hasMore: false // En modo mock, no hay más páginas
        }));
        setUsingMockData(true);
      });
    } finally {
      setLoading(false);
    }
  }, [selectedClient, selectedRace, filters.query, pagination.currentPage, pagination.itemsPerPage]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadPerformanceData();
  }, [loadPerformanceData]);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (selectedClient || selectedRace || filters.query) {
      const timer = setTimeout(() => {
        loadPerformanceData();
      }, 500); // Debounce para evitar muchas llamadas

      return () => clearTimeout(timer);
    }
  }, [selectedClient, selectedRace, filters.query, loadPerformanceData]); // ✅ Agregado loadPerformanceData

  // Recargar datos cuando cambie la página
  useEffect(() => {
    loadPerformanceData();
  }, [pagination.currentPage, loadPerformanceData]); // ✅ Agregado loadPerformanceData

  // Los datos ya vienen paginados desde la API
  // Renombrado de filteredData a displayData para mayor claridad
  const displayData = useMemo(() => {
    return [...performanceData];
  }, [performanceData]);

  // Manejar cambio en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1, hasMore: true }));
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      client_id: null,
      raza_id: null,
      query: ""
    });
    setSelectedClient(null);
    setClientSearchTerm("");
    setSelectedRace(null);
    setPagination(prev => ({ 
      ...prev, 
      currentPage: 1,
      hasMore: true
    }));
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

      {/* Panel de Estadísticas */}
      {summaryStats && !usingMockData && (
        <div className="row mb-4">
          <div className="col-md-2">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h5 className="card-title">{summaryStats.total_toros}</h5>
                <p className="card-text">Total Toros</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h5 className="card-title">{summaryStats.total_donantes_fertilizadas.toLocaleString()}</h5>
                <p className="card-text">Donantes Fertilizadas</p>
              </div>
            </div>
          </div>
          <div className="col-md-2">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h5 className="card-title">{summaryStats.total_ovocitos_civ.toLocaleString()}</h5>
                <p className="card-text">Ovocitos al CIV</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-dark">
              <div className="card-body text-center">
                <h5 className="card-title">{summaryStats.promedio_porcentaje_produccion.toFixed(2)}%</h5>
                <p className="card-text">Promedio Producción</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-secondary text-white">
              <div className="card-body text-center">
                <h5 className="card-title">{summaryStats.promedio_donantes_por_toro.toFixed(1)}</h5>
                <p className="card-text">Promedio Donantes/Toro</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Filtro por Cliente */}
            <div className="col-md-4">
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

            {/* Filtro por Raza */}
            <div className="col-md-4">
              <label className="form-label">Raza</label>
              <select
                className="form-select"
                value={selectedRace?.id || ""}
                onChange={(e) => {
                  const raceId = e.target.value ? parseInt(e.target.value) : null;
                  const race = races.find(r => r.id === raceId) || null;
                  setSelectedRace(race);
                  setFilters(prev => ({ ...prev, raza_id: raceId }));
                }}
                disabled={loadingRaces}
              >
                <option value="">Todas las razas</option>
                {races.map((race) => (
                  <option key={race.id} value={race.id}>
                    {race.name || race.nombre || `Raza ${race.id}`}
                  </option>
                ))}
              </select>
              {loadingRaces && (
                <div className="mt-2">
                  <small className="text-muted">
                    <i className="bi bi-hourglass-split me-1"></i>
                    Cargando razas...
                  </small>
                </div>
              )}
            </div>

            {/* Filtro General */}
            <div className="col-md-4">
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
              <th width="20%">Registro</th>
              <th width="10%">Lote</th>
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
            ) : displayData.length === 0 ? (
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
              displayData.map((item) => (
                <tr key={item.id}>
                  <td className="fw-semibold">{item.nombre}</td>
                  <td>{item.raza}</td>
                  <td>{item.registro}</td>
                  <td>{item.lote}</td>
                  <td>{item.donantes_fertilizadas.toLocaleString()}</td>
                  <td>{item.oocitos_civ.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${(item.porcentaje_produccion || 0) >= 40 ? 'bg-success' : (item.porcentaje_produccion || 0) >= 30 ? 'bg-warning' : 'bg-danger'}`}>
                      {item.porcentaje_produccion || 0}%
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
      {pagination.totalItems > 0 && (
        <div className="d-flex justify-content-center mt-3">
          <nav aria-label="Paginación de rendimiento">
            <ul className="pagination">
              <li className={`page-item ${pagination.currentPage === 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  <i className="bi bi-chevron-left"></i> Anterior
                </button>
              </li>

              {/* Mostrar números de página solo si hay más de una página */}
              {pagination.currentPage > 1 && (
                <li className="page-item">
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    {pagination.currentPage - 1}
                  </button>
                </li>
              )}

              <li className="page-item active">
                <button className="page-link">
                  {pagination.currentPage}
                </button>
              </li>

              <li className={`page-item ${!pagination.hasMore ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasMore}
                >
                  Siguiente <i className="bi bi-chevron-right"></i>
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Resumen de resultados */}
      {pagination.totalItems > 0 && (
        <div className="mt-3 text-muted text-center">
          <small>
            Página {pagination.currentPage} - Mostrando {displayData.length} registros
            {!pagination.hasMore && " (última página)"}
          </small>
        </div>
      )}
    </div>
  );
};

export default BullPerformance;
