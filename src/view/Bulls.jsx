import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { filterBulls, deleteBull, createBull, getBullsByClient } from '../Api/bulls';
import { racesApi, sexesApi, usersApi } from '../Api';

const Bulls = () => {
  const navigate = useNavigate();
  
  // Estado para el filtro
  const [filter, setFilter] = useState({
    searchQuery: '',
    race: '',
    sex: '',
    status: ''
  });
  
  // Estado para los datos
  const [bulls, setBulls] = useState([]);
  const [filteredBulls, setFilteredBulls] = useState([]);
  const [races, setRaces] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para manejo de clientes
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  
  // Estado para el modal de nuevo toro
  const [showNewBullModal, setShowNewBullModal] = useState(false);
  const [newBullData, setNewBullData] = useState({
    name: '',
    register: '',
    race_id: '',
    sex_id: '',
    status: 'Active'
  });
  
  // Estado para el modal de entrada
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedBull, setSelectedBull] = useState(null);
  const [quantityReceived, setQuantityReceived] = useState('');
  const [inputLoading, setInputLoading] = useState(false);
  
  // Estado para las entradas del toro seleccionado
  const [bullInputs, setBullInputs] = useState([]);
  const [loadingInputs, setLoadingInputs] = useState(false);
  
  // Paginación
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  });

  // Añadir nuevos estados para el modal de detalles
  const [showInputDetailsModal, setShowInputDetailsModal] = useState(false);
  const [selectedInput, setSelectedInput] = useState(null);
  const [loadingInputDetails, setLoadingInputDetails] = useState(false);

  // Estados para los datos de referencia (razas y sexos)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [racesData, sexesData] = await Promise.all([
          racesApi.getRaces(),
          sexesApi.getSexes()
        ]);
        
        setRaces(racesData);
        setSexes(sexesData);
      } catch (err) {
        console.error("Error al cargar datos de referencia:", err);
      }
    };
    
    fetchReferenceData();
  }, []);

  // Obtener toros
  const fetchBulls = async () => {
    try {
      setLoading(true);
      setError(null);

      // Solo usar búsqueda por texto en el backend
      const filterParams = {
        skip: (pagination.currentPage - 1) * pagination.itemsPerPage,
        limit: pagination.itemsPerPage
      };
      
      if (filter.searchQuery?.trim()) {
        filterParams.search = filter.searchQuery.trim();
      }

      console.log('Enviando filtros al backend:', filterParams);

      const response = await filterBulls(filterParams);
      const bullsList = Array.isArray(response) ? response : (response.items || []);
      
      setBulls(bullsList);
      applyLocalFilters(bullsList); // Aplicar filtros locales después de obtener los datos
    } catch (error) {
      console.error("Error al obtener toros:", error);
      setError(error.response?.data?.detail || "No se pudieron cargar los toros. Por favor, intente más tarde.");
      setBulls([]);
      setFilteredBulls([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar filtros locales
  const applyLocalFilters = useCallback((bullsToFilter) => {
    let filtered = [...bullsToFilter];

    // Filtrar por raza
    if (filter.race) {
      filtered = filtered.filter(bull => bull.race_name === filter.race);
    }

    // Filtrar por sexo
    if (filter.sex) {
      filtered = filtered.filter(bull => bull.sex_name === filter.sex);
    }

    // Filtrar por estado
    if (filter.status) {
      const statusToFilter = filter.status === 'Activo' ? 'Active' : 'Inactive';
      filtered = filtered.filter(bull => bull.status === statusToFilter);
    }

    console.log('Resultados después de filtros locales:', filtered);
    
    setFilteredBulls(filtered);
    setPagination(prev => ({
      ...prev,
      totalItems: filtered.length
    }));
  }, [filter]);

  // Efecto para aplicar filtros locales cuando cambian los filtros
  useEffect(() => {
    applyLocalFilters(bulls);
  }, [filter.race, filter.sex, filter.status, bulls, applyLocalFilters]);

  // Efecto para cargar datos cuando cambia la búsqueda o la paginación
  useEffect(() => {
    if (races.length > 0 && sexes.length > 0) {
      const timer = setTimeout(() => {
        fetchBulls();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [filter.searchQuery, pagination.currentPage, races.length, sexes.length]);

  // Manejar cambio en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log('Cambio en filtro:', name, value); // Para debugging
    
    // Actualizar el filtro y reiniciar la paginación
    setFilter(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Resetear filtros
  const resetFilters = async () => {
    setFilter({
      searchQuery: '',
      race: '',
      sex: '',
      status: ''
    });
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
      totalItems: 0
    }));

    try {
      setLoading(true);
      setError(null);
      
      // Si hay un cliente seleccionado, cargar sus toros
      if (selectedClient) {
        const response = await getBullsByClient(selectedClient.id);
        const bullsList = Array.isArray(response) ? response : (response?.items || []);
        setBulls(bullsList);
        applyLocalFilters(bullsList);
      } else {
        setBulls([]);
        setFilteredBulls([]);
      }
    } catch (error) {
      console.error("Error al resetear filtros:", error);
      let errorMessage = "Error al cargar los datos. ";
      
      if (error.response?.data?.detail) {
        const details = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail[0]?.msg 
          : error.response.data.detail;
        errorMessage += typeof details === 'string' ? details : 'Error de validación';
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Error desconocido";
      }
      
      setError(errorMessage);
      setBulls([]);
      setFilteredBulls([]);
    } finally {
      setLoading(false);
    }
  };

  // Manejar click en fila o en botón de ver detalles
  const handleViewDetails = (bullId, e) => {
    if (e) {
      e.stopPropagation(); // Evitar que se propague si viene de un botón
    }
    navigate(`/bulls/${bullId}/edit`);
  };

  // Función para registrar entrada rápida
  const handleQuickInput = async (e) => {
    e.preventDefault();
    
    if (!selectedBull || !quantityReceived || isNaN(parseFloat(quantityReceived)) || parseFloat(quantityReceived) <= 0) {
      alert('Por favor ingrese una cantidad válida mayor a cero');
      return;
    }

    if (!selectedClient || !selectedClient.id) {
      alert('Error: No hay un cliente seleccionado');
      return;
    }
    
    setInputLoading(true);
    
    try {
      // Datos de depuración
      console.log('=== Creando entrada ===');
      console.log('Toro seleccionado:', selectedBull);
      console.log('Cliente dueño del toro:', selectedClient);

      // Crear objeto de entrada - asignamos al cliente dueño del toro usando user_id
      const inputData = {
        bull_id: selectedBull.id,
        user_id: selectedClient.id,     // Asignamos la entrada al cliente dueño del toro
        quantity_received: parseFloat(quantityReceived),
        date: new Date().toISOString().split('T')[0]
      };

      console.log('Datos a enviar al servidor:', inputData);
      
      // Crear la entrada
      const inputsModule = await import('../Api/inputs');
      const response = await inputsModule.createInput(inputData);
      console.log('Respuesta del servidor:', response);
      
      // Recargar las entradas
      const inputs = await inputsModule.getInputsByBull(selectedBull.id, 0, 100);
      const formattedInputs = Array.isArray(inputs) ? inputs : (inputs.items || []);
      setBullInputs(formattedInputs);
      
      // Limpiar el formulario
      setQuantityReceived('');
      
      // Notificar éxito
      alert('Entrada registrada correctamente');
    } catch (error) {
      console.error('=== Error al registrar entrada ===');
      console.error('Error completo:', error);
      console.error('Datos que se intentaron enviar:', {
        bull: selectedBull,
        client: selectedClient,
        quantity: quantityReceived
      });
      alert('Error al registrar la entrada: ' + (error.response?.data?.detail || error.message));
    } finally {
      setInputLoading(false);
    }
  };

  // Función para abrir modal de entrada y cargar entradas del toro
  const openInputModal = async (bull, e) => {
    e.stopPropagation();
    
    // Verificar que tenemos un cliente seleccionado
    if (!selectedClient || !selectedClient.id) {
      alert('Error: Debe seleccionar un cliente primero');
      return;
    }

    console.log('Abriendo modal para el toro:', bull);
    console.log('Cliente dueño del toro:', selectedClient);

    setSelectedBull(bull);
    setQuantityReceived('');
    setShowInputModal(true);
    
    // Cargar las entradas existentes de este toro
    try {
      setLoadingInputs(true);
      const inputsModule = await import('../Api/inputs');
      const inputs = await inputsModule.getInputsByBull(bull.id, 0, 100);
      
      // Formatear las entradas para mostrarlas
      const formattedInputs = Array.isArray(inputs) ? inputs : (inputs.items || []);
      setBullInputs(formattedInputs);
    } catch (error) {
      console.error("Error al cargar entradas del toro:", error);
    } finally {
      setLoadingInputs(false);
    }
  };

  // Función para ver detalles de una entrada
  const viewInputDetails = async (inputId, e) => {
    e.stopPropagation();
    setLoadingInputDetails(true);
    
    try {
      // Buscar primero si ya tenemos esa entrada en nuestro array de bullInputs
      const existingInput = bullInputs.find(input => input.id === inputId);
      
      if (existingInput) {
        // Si ya tenemos los datos de la entrada, la usamos directamente
        setSelectedInput(existingInput);
        setShowInputDetailsModal(true);
      } else {
        // Si no la tenemos, intentamos obtenerla del API
        const inputsModule = await import('../Api/inputs');
        
        // Verificar si la función existe
        if (typeof inputsModule.getInputById !== 'function') {
          // Si no existe getInputById, usamos filterInputs con el ID específico
          const response = await inputsModule.filterInputs({ inputId }, 0, 1);
          const foundInput = Array.isArray(response) && response.length > 0 
            ? response[0] 
            : (response.items && response.items.length > 0 ? response.items[0] : null);
          
          if (foundInput) {
            setSelectedInput(foundInput);
            setShowInputDetailsModal(true);
          } else {
            throw new Error('No se encontró la entrada');
          }
        } else {
          // Si existe getInputById, la usamos normalmente
          const inputDetails = await inputsModule.getInputById(inputId);
          setSelectedInput(inputDetails);
          setShowInputDetailsModal(true);
        }
      }
    } catch (error) {
      console.error('Error al cargar detalles de la entrada:', error);
      alert('No se pudieron cargar los detalles de la entrada. ' + (error.message || ''));
    } finally {
      setLoadingInputDetails(false);
    }
  };

  // Cargar clientes
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      setError(null);

      const filters = {
        role_id: 3, // ID del rol de cliente
        search: clientSearchTerm
      };

      const response = await usersApi.filterUsers(filters, 0, 100);
      const clientsList = Array.isArray(response) ? response : (response.items || []);
      setClients(clientsList);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setError("No se pudieron cargar los clientes. " + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingClients(false);
    }
  };

  // Efecto para cargar clientes cuando cambia el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearchTerm.trim() !== '') {
        loadClients();
      } else {
        setClients([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearchTerm]);

  // Función para seleccionar un cliente
  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setClientSearchTerm('');
    setClients([]);
    
    // Cargar los toros del cliente seleccionado
    try {
      setLoading(true);
      setError(null);
      
      console.log("Buscando toros para el cliente:", client);
      
      const response = await getBullsByClient(client.id);
      console.log("Respuesta de la API:", response);
      
      let bullsList = [];
      if (Array.isArray(response)) {
        bullsList = response;
      } else if (response && response.items) {
        bullsList = response.items;
      } else if (response && response.results) {
        bullsList = response.results;
      } else {
        console.warn("Formato de respuesta inesperado:", response);
        bullsList = [];
      }

      console.log("Lista de toros procesada:", bullsList);
      
      setBulls(bullsList);
      applyLocalFilters(bullsList);
    } catch (error) {
      console.error("Error al cargar toros del cliente:", error);
      let errorMessage = "No se pudieron cargar los toros del cliente. ";
      
      if (error.response?.data?.detail) {
        const details = Array.isArray(error.response.data.detail) 
          ? error.response.data.detail[0]?.msg 
          : error.response.data.detail;
        console.error("Detalles del error:", error.response.data);
        errorMessage += details || JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Error desconocido";
      }
      
      setError(errorMessage);
      setBulls([]);
      setFilteredBulls([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para crear un nuevo toro
  const handleCreateBull = async (e) => {
    e.preventDefault();
    
    if (!selectedClient) {
      alert('Por favor seleccione un cliente primero');
      return;
    }

    try {
      setLoading(true);
      
      // Crear el toro para el cliente seleccionado
      const response = await createBull({
        ...newBullData,
        user_id: selectedClient.id
      });

      // Actualizar la lista de toros
      setBulls(prev => [response, ...prev]);
      applyLocalFilters([response, ...bulls]);
      
      // Limpiar el formulario y cerrar el modal
      setNewBullData({
        name: '',
        register: '',
        race_id: '',
        sex_id: '',
        status: 'Active'
      });
      setShowNewBullModal(false);
      
      alert('Toro creado exitosamente');
    } catch (error) {
      console.error("Error al crear toro:", error);
      alert("Error al crear el toro: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambios en el formulario de nuevo toro
  const handleNewBullChange = (e) => {
    const { name, value } = e.target;
    setNewBullData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="container-fluid py-4 bulls-view">
      {/* Título y selección de cliente */}
      <div className="mb-4">
        <h2 className="mb-3">
          <i className="bi bi-database-fill me-2"></i>
          Gestión de Toros
        </h2>

        {/* Selección de cliente */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              <div className="col-md-6">
                <label className="form-label">Buscar Cliente</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nombre, documento o email..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                  />
                  {loadingClients && (
                    <span className="input-group-text">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </span>
                  )}
                </div>
                {/* Lista de clientes encontrados */}
                {clients.length > 0 && (
                  <div className="list-group mt-2 shadow-sm">
                    {clients.map(client => (
                      <button
                        key={client.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{client.full_name}</strong>
                            <br />
                            <small className="text-muted">
                              Doc: {client.number_document} | {client.email}
                            </small>
                          </div>
                          <i className="bi bi-chevron-right"></i>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-md-6">
                {selectedClient && (
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="card-title mb-1">Cliente Seleccionado</h5>
                          <h6 className="mb-2">{selectedClient.full_name}</h6>
                          <p className="mb-0 small">
                            <strong>Documento:</strong> {selectedClient.number_document}<br />
                            <strong>Email:</strong> {selectedClient.email}<br />
                            <strong>Teléfono:</strong> {selectedClient.phone}
                          </p>
                        </div>
                        <button 
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => setSelectedClient(null)}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Filtros solo visibles si hay un cliente seleccionado */}
        {selectedClient && (
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Búsqueda</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre o registro..."
                    name="searchQuery"
                    value={filter.searchQuery}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">Raza</label>
                  <select 
                    className="form-select"
                    name="race"
                    value={filter.race}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todas las razas</option>
                    {races.map(race => (
                      <option key={race.id} value={race.name}>
                        {race.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">Sexo</label>
                  <select 
                    className="form-select"
                    name="sex"
                    value={filter.sex}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todos los sexos</option>
                    {sexes.map(sex => (
                      <option key={sex.id} value={sex.name}>
                        {sex.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-3">
                  <label className="form-label">Estado</label>
                  <select 
                    className="form-select"
                    name="status"
                    value={filter.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todos los estados</option>
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>
              
              <div className="d-flex justify-content-end mt-3">
                <button 
                  className="btn btn-outline-secondary me-2" 
                  onClick={resetFilters}
                  disabled={loading}
                >
                  <i className="bi bi-x-circle me-2"></i>
                  Limpiar
                </button>
                
                <button 
                  className="btn btn-primary" 
                  onClick={fetchBulls}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : (
                    <i className="bi bi-search me-2"></i>
                  )}
                  Filtrar
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Botón para agregar nuevo toro (solo visible si hay un cliente seleccionado) */}
        {selectedClient && (
          <div className="d-flex justify-content-end mb-3">
            <button 
              className="btn btn-success" 
              onClick={() => setShowNewBullModal(true)}
            >
              <i className="bi bi-plus-circle me-2"></i>
              Nuevo Toro
            </button>
          </div>
        )}
      </div>
      
      {/* Tabla de toros (solo visible si hay un cliente seleccionado) */}
      {selectedClient && (
        <div className="table-responsive rounded-3 border">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th width="5%">ID</th>
                <th width="20%">Nombre</th>
                <th width="15%">Registro</th>
                <th width="20%">Raza</th>
                <th width="15%">Sexo</th>
                <th width="15%">Estado</th>
                <th width="10%">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Buscando toros...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center text-danger py-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {typeof error === 'string' ? error : 'Error al cargar los datos'}
                  </td>
                </tr>
              ) : filteredBulls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    <i className="bi bi-database me-2"></i>
                    {filter.searchQuery || filter.race || filter.sex || filter.status ? 
                      'No se encontraron toros con esos criterios de búsqueda' : 
                      'No hay toros registrados para este cliente'}
                  </td>
                </tr>
              ) : (
                filteredBulls.map(bull => {
                  // Buscar nombres de raza y sexo
                  const raceName = races.find(r => r.id === bull.race_id)?.name || 'Desconocida';
                  const sexName = sexes.find(s => s.id === bull.sex_id)?.name || 'Desconocido';
                  
                  return (
                    <tr 
                      key={bull.id}
                      onClick={() => handleViewDetails(bull.id)}
                      className="cursor-pointer"
                    >
                      <td className="fw-semibold">#{bull.id}</td>
                      <td>{bull.name || 'Sin nombre'}</td>
                      <td>{bull.register || 'Sin registro'}</td>
                      <td>{raceName}</td>
                      <td>{sexName}</td>
                      <td>
                        <span className={`badge ${bull.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                          {bull.status === 'Active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group">
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => handleViewDetails(bull.id, e)}
                            title="Ver/Editar detalles"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-success ms-1"
                            onClick={(e) => openInputModal(bull, e)}
                            title="Registrar entrada rápida"
                          >
                            <i className="bi bi-plus-circle"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger ms-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('¿Está seguro de eliminar este toro?')) {
                                deleteBull(bull.id)
                                  .then(() => {
                                    fetchBulls();
                                    alert('Toro eliminado correctamente');
                                  })
                                  .catch(err => {
                                    console.error('Error al eliminar:', err);
                                    alert('Error al eliminar: ' + (err.response?.data?.detail || err.message));
                                  });
                              }
                            }}
                            title="Eliminar toro"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal para nuevo toro */}
      {showNewBullModal && (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo Toro para {selectedClient?.full_name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowNewBullModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateBull}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={newBullData.name}
                      onChange={handleNewBullChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Registro</label>
                    <input
                      type="text"
                      className="form-control"
                      name="register"
                      value={newBullData.register}
                      onChange={handleNewBullChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Raza</label>
                    <select
                      className="form-select"
                      name="race_id"
                      value={newBullData.race_id}
                      onChange={handleNewBullChange}
                      required
                    >
                      <option value="">Seleccione una raza</option>
                      {races.map(race => (
                        <option key={race.id} value={race.id}>
                          {race.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Sexo</label>
                    <select
                      className="form-select"
                      name="sex_id"
                      value={newBullData.sex_id}
                      onChange={handleNewBullChange}
                      required
                    >
                      <option value="">Seleccione un sexo</option>
                      {sexes.map(sex => (
                        <option key={sex.id} value={sex.id}>
                          {sex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      name="status"
                      value={newBullData.status}
                      onChange={handleNewBullChange}
                    >
                      <option value="Active">Activo</option>
                      <option value="Inactive">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowNewBullModal(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    ) : (
                      <i className="bi bi-save me-2"></i>
                    )}
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mantener los modales existentes */}
      {showInputModal && (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Entradas del Toro: {selectedBull?.name || 'Sin nombre'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowInputModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Formulario para nueva entrada */}
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">Registrar Nueva Entrada</h6>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleQuickInput}>
                          <div className="mb-3">
                            <label className="form-label">Cantidad Recibida (ml)</label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={quantityReceived} 
                              onChange={(e) => setQuantityReceived(e.target.value)}
                              placeholder="Ej: 10.5"
                              min="0.1"
                              step="0.1"
                              required
                            />
                            <small className="text-muted">Ingrese la cantidad en mililitros</small>
                          </div>
                          <button 
                            type="submit" 
                            className="btn btn-primary w-100" 
                            disabled={inputLoading}
                          >
                            {inputLoading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            ) : (
                              <i className="bi bi-plus-circle me-2"></i>
                            )}
                            Registrar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                  
                  {/* Lista de entradas existentes */}
                  <div className="col-md-8">
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Historial de Entradas</h6>
                      </div>
                      <div className="card-body p-0">
                        {loadingInputs ? (
                          <div className="text-center py-4">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Cargando...</span>
                            </div>
                            <p className="mt-2 text-muted">Cargando entradas...</p>
                          </div>
                        ) : bullInputs.length === 0 ? (
                          <div className="text-center py-4 text-muted">
                            <i className="bi bi-inbox fs-3 d-block mb-2"></i>
                            <p>No hay entradas registradas para este toro</p>
                          </div>
                        ) : (
                          <div className="table-responsive">
                            <table className="table table-hover table-sm mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>ID</th>
                                  <th>Fecha</th>
                                  <th>Cantidad (ml)</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bullInputs.map(input => (
                                  <tr key={input.id}>
                                    <td>{input.id}</td>
                                    <td>{input.created_at ? new Date(input.created_at).toLocaleDateString() : 'N/A'}</td>
                                    <td>{parseFloat(input.quantity_received).toFixed(1)} ml</td>
                                    <td>
                                      <button 
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={(e) => viewInputDetails(input.id, e)}
                                      >
                                        <i className="bi bi-eye"></i>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowInputModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showInputDetailsModal && selectedInput && (
        <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Detalles de Entrada #{selectedInput.id || selectedInput.input_id || '?'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowInputDetailsModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {loadingInputDetails ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : (
                  <div className="card border-0">
                    <div className="card-body p-0">
                      <table className="table table-borderless table-sm mb-0">
                        <tbody>
                          <tr>
                            <th className="text-muted" width="40%">ID:</th>
                            <td>{selectedInput.id || selectedInput.input_id || 'No disponible'}</td>
                          </tr>
                          <tr>
                            <th className="text-muted">Toro:</th>
                            <td>{selectedInput.bull_name || selectedBull?.name || 'Sin nombre'}</td>
                          </tr>
                          <tr>
                            <th className="text-muted">Fecha de registro:</th>
                            <td>{selectedInput.created_at ? new Date(selectedInput.created_at).toLocaleString() : 'N/A'}</td>
                          </tr>
                          <tr>
                            <th className="text-muted">Cantidad recibida:</th>
                            <td><span className="fw-bold">{parseFloat(selectedInput.quantity_received).toFixed(1)} ml</span></td>
                          </tr>
                          <tr>
                            <th className="text-muted">Cantidad utilizada:</th>
                            <td>
                              {parseFloat(selectedInput.quantity_used || 0).toFixed(1)} ml
                            </td>
                          </tr>
                          <tr>
                            <th className="text-muted">Total disponible:</th>
                            <td>
                              {(() => {
                                // Calcular el total disponible
                                const received = parseFloat(selectedInput.quantity_received || 0);
                                const used = parseFloat(selectedInput.quantity_used || 0);
                                const available = selectedInput.quantity_available !== undefined 
                                  ? parseFloat(selectedInput.quantity_available) 
                                  : (received - used);
                                
                                // Verificar si está agotado
                                const isOutOfStock = available <= 0;
                                
                                return (
                                  <>
                                    <span className={`fw-bold ${isOutOfStock ? 'text-danger' : 'text-success'}`}>
                                      {available.toFixed(1)} ml
                                    </span>
                                    {isOutOfStock && 
                                      <span className="ms-2 badge bg-danger">Agotado</span>
                                    }
                                  </>
                                );
                              })()}
                            </td>
                          </tr>
                          <tr>
                            <th className="text-muted">Código de lote:</th>
                            <td>{selectedInput.lot_code || 'Sin código de lote'}</td>
                          </tr>
                          <tr>
                            <th className="text-muted">Observaciones:</th>
                            <td>{selectedInput.observations || 'Sin observaciones'}</td>
                          </tr>
                          <tr>
                            <th className="text-muted">Registrado por:</th>
                            <td>{selectedInput.created_by_name || 'Sistema'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {/* <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowInputDetailsModal(false)}
                >
                  Cerrar
                </button> */}
                {/* <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => navigate(`/inputs/${selectedInput.id || selectedInput.input_id}`)}
                >
                  Ver página completa
                </button> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos personalizados */}
      <style>
        {`
          .bulls-view {
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
        `}
      </style>
    </div>
  );
};

export default Bulls; 