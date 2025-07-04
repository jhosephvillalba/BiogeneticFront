import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { deleteBull, createBull, getBull, getBullsWithAvailableSamples} from "../Api/bulls";
import { racesApi, sexesApi, usersApi } from "../Api";
import { getInputsByBull } from "../Api/inputs";

const BullsByClient = () => {
  const navigate = useNavigate();

  // Estado para el filtro local
  const [filter, setFilter] = useState({
    searchQuery: "",
    race: "",
    sex: "",
    status: "",
  });

  // Estado para los datos
  const [filtered, setFilteredBulls] = useState([]);
  const [bulls, setBulls] = useState([]);
  const [races, setRaces] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para manejo de clientes
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(() => {
    // Intentar recuperar el cliente del localStorage al iniciar
    const savedClient = localStorage.getItem('selectedClient');
    return savedClient ? JSON.parse(savedClient) : null;
  });
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");

  // Estado para el modal de nuevo toro
  const [showNewBullModal, setShowNewBullModal] = useState(false);
  const [newBullData, setNewBullData] = useState({
    name: "",
    lote: "",
    register: "",
    escalerilla: "",
    race_id: 0,
    sex_id: 0,
    status: "Active",
    description: "",
  });

  // Estado para el modal de entrada
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedBull, setSelectedBull] = useState(null);
  const [quantityReceived, setQuantityReceived] = useState("");
  const [inputLoading, setInputLoading] = useState(false);

  // Estado para las entradas del toro seleccionado
  const [bullInputs, setBullInputs] = useState([]);
  const [loadingInputs, setLoadingInputs] = useState(false);

  // Paginación local
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 10,
  });

  // Estado para el modal de detalles del toro
  const [showBullDetailModal, setShowBullDetailModal] = useState(false);
  const [bullDetail, setBullDetail] = useState(null);
  const [loadingBullDetail, setLoadingBullDetail] = useState(false);

  // Estado para el modal de inventario de entradas
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryInputs, setInventoryInputs] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [inventoryBull, setInventoryBull] = useState(null);

  // Función para aplicar filtros locales
  const applyLocalFilters = useCallback(
    (bullsToFilter) => {
      let filtered = [...bullsToFilter];

      // Filtrar por raza
      if (filter.race) {
        filtered = filtered.filter((bull) => bull.race_name === filter.race);
      }

      // Filtrar por sexo
      if (filter.sex) {
        filtered = filtered.filter((bull) => bull.sex_name === filter.sex);
      }

      // Filtrar por estado
      if (filter.status) {
        const statusToFilter =
          filter.status === "Activo" ? "Active" : "Inactive";
        filtered = filtered.filter((bull) => bull.status === statusToFilter);
      }

      console.log("Resultados después de filtros locales:", filtered);

      setFilteredBulls(filtered);
      setPagination((prev) => ({
        ...prev,
        totalItems: filtered.length,
      }));
    },
    [filter]
  );

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    // Guardar el cliente seleccionado en localStorage
    localStorage.setItem('selectedClient', JSON.stringify(client));
    setClientSearchTerm("");
    setClients([]);

    // Cargar los toros del cliente seleccionado
    try {
      setLoading(true);
      setError(null);

      console.log("Buscando toros para el cliente:", client);

      const response = await getBullsWithAvailableSamples(client.id);
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

  // Función para limpiar el cliente seleccionado
  const clearSelectedClient = () => {
    setSelectedClient(null);
    localStorage.removeItem('selectedClient');
  };

  // Cargar datos de referencia (razas y sexos)
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [racesData, sexesData] = await Promise.all([
          racesApi.getRaces(),
          sexesApi.getSexes(),
        ]);
        setRaces(racesData);
        setSexes(sexesData);
      } catch (err) {
        console.error("Error al cargar datos de referencia:", err);
      }
    };
    fetchReferenceData();
  }, []);

  // Función para aplicar filtros locales con useMemo para optimización
  const filteredBulls = useMemo(() => {
    let result = [...bulls];

    // Filtro general: busca en todas las columnas relevantes
    if (filter.searchQuery) {
      const searchTerm = filter.searchQuery.toLowerCase();
      result = result.filter((bull) =>
        [
          bull.name,
          bull.register || bull.registration_number,
          bull.lote,
          bull.escalerilla,
          bull.description,
          races.find((r) => r.id === bull.race_id)?.name,
          sexes.find((s) => s.id === bull.sex_id)?.name,
        ]
          .map((val) => (val ? val.toString().toLowerCase() : ""))
          .some((val) => val.includes(searchTerm))
      );
    }

    // Filtro por raza
    if (filter.race) {
      const race = races.find((r) => r.name === filter.race);
      if (race) {
        result = result.filter((bull) => bull.race_id === race.id);
      }
    }

    // Filtro por sexo
    if (filter.sex) {
      const sex = sexes.find((s) => s.name === filter.sex);
      if (sex) {
        result = result.filter((bull) => bull.sex_id === sex.id);
      }
    }

    // Filtro por estado
    if (filter.status) {
      const statusToFilter = filter.status === "Activo" ? "active" : "inactive";
      result = result.filter((bull) => bull.status === statusToFilter);
    }

    return result;
  }, [bulls, filter, races, sexes]);

  // Paginar los resultados filtrados
  const paginatedBulls = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    return filteredBulls.slice(
      startIndex,
      startIndex + pagination.itemsPerPage
    );
  }, [filteredBulls, pagination]);

  // Cargar toros del cliente seleccionado
  const loadClientBulls = useCallback(async () => {
    if (!selectedClient) {
      setBulls([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await getBullsWithAvailableSamples(selectedClient.id);
      console.log({response:response}); 

      setBulls(response || []);
      setPagination((prev) => ({ ...prev, currentPage: 1 })); // Resetear a primera página
    } catch (error) {
      console.error("Error al cargar toros:", error);
      setError("Error al cargar los toros del cliente");
      setBulls([]);
    } finally {
      setLoading(false);
    }
  }, [selectedClient]);

  // Efecto para cargar toros cuando cambia el cliente
  useEffect(() => {
    loadClientBulls();
  }, [loadClientBulls]);

  // Cargar clientes
  const loadClients = useCallback(async () => {
    try {
      setLoadingClients(true);
      setError(null);

      const filters = {
        role_id: 3, // ID del rol de cliente
        q: clientSearchTerm,
      };

      const response = await usersApi.searchUsers(filters, 0, 100);
      const clientsList = Array.isArray(response)
        ? response
        : response.items || [];
      setClients(clientsList);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setError(
        "No se pudieron cargar los clientes. " +
          (error.response?.data?.detail || error.message)
      );
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

  // Manejar cambio en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Resetear a primera página
  };

  // Resetear filtros
  const resetFilters = () => {
    setFilter({
      searchQuery: "",
      race: "",
      // sex: '',
      // status: ''
    });
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // Manejar cambio de página
  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  // Función para crear un nuevo toro
  const handleCreateBull = async (e) => {
    e.preventDefault();

    if (!selectedClient) {
      alert("Por favor seleccione un cliente primero");
      return;
    }

    try {
      setLoading(true);

      // Crear el toro para el cliente seleccionado
      const response = await createBull({
        ...newBullData,
        user_id: selectedClient.id,
      });

      // Actualizar la lista de toros localmente
      setBulls((prev) => [response, ...prev]);

      // Limpiar el formulario y cerrar el modal
      setNewBullData({
        name: "",
        register: "",
        race_id: 0,
        sex_id: 0,
        status: "Active",
        lote: "",
        escalerilla: "",
        description: "",
      });
      setShowNewBullModal(false);

      alert("Toro creado exitosamente");
    } catch (error) {
      console.error("Error al crear toro:", error);
      alert(
        "Error al crear el toro: " +
          (error.response?.data?.detail || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un toro
  const handleDeleteBull = async (bullId) => {
    if (!window.confirm("¿Está seguro de eliminar este toro?")) return;

    try {
      setLoading(true);
      await deleteBull(bullId);

      // Actualizar la lista localmente
      setBulls((prev) => prev.filter((bull) => bull.id !== bullId));

      alert("Toro eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar toro:", error);
      alert(
        "Error al eliminar: " + (error.response?.data?.detail || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir modal de entrada
  const openInputModal = async (bull, e) => {
    e.stopPropagation();

    if (!selectedClient) {
      alert("Error: Debe seleccionar un cliente primero");
      return;
    }

    setSelectedBull(bull);
    setQuantityReceived("");
    setShowInputModal(true);

    // Cargar las entradas existentes de este toro
    try {
      setLoadingInputs(true);
      const inputsModule = await import("../Api/inputs");
      const inputs = await inputsModule.getInputsByBull(bull.id, 0, 100);
      const filterInpust = inputs.filter(
        (input) =>
          input.status_id !== "Completed" && input.status_id !== "Cancelled"
      );
      console.log("Entradas cargadas:", inputs);
      setBullInputs(filterInpust || []);
    } catch (error) {
      console.error("Error al cargar entradas:", error);
    } finally {
      setLoadingInputs(false);
    }
  };

  // Función para registrar entrada rápida
  const handleQuickInput = async (e) => {
    e.preventDefault();

    if (
      !selectedBull ||
      !quantityReceived ||
      isNaN(parseFloat(quantityReceived)) ||
      parseFloat(quantityReceived) <= 0
    ) {
      alert("Por favor ingrese una cantidad válida mayor a cero");
      return;
    }

    if (!selectedClient) {
      alert("Error: No hay un cliente seleccionado");
      return;
    }

    setInputLoading(true);

    try {
      const inputData = {
        bull_id: selectedBull.id,
        user_id: selectedClient.id,
        quantity_received: parseFloat(quantityReceived),
        date: new Date().toISOString().split("T")[0],
        escalarilla: selectedBull.escalerilla || "",
        lote: selectedBull.lote || "",
      };

      const inputsModule = await import("../Api/inputs");
      await inputsModule.createInput(inputData);

      // Recargar las entradas
      const inputs = await inputsModule.getInputsByBull(
        selectedBull.id,
        0,
        100
      );
      const filterInpust = inputs.filter(
        (input) =>
          input.status_id !== "Completed" && input.status_id !== "Cancelled"
      );

      setBullInputs(filterInpust || []);

      setQuantityReceived("");
      alert("Entrada registrada correctamente");
    } catch (error) {
      console.error("Error al registrar entrada:", error);
      alert(
        "Error al registrar la entrada: " +
          (error.response?.data?.detail || error.message)
      );
    } finally {
      setInputLoading(false);
    }
  };

  // Función para abrir el modal de detalles del toro
  const openBullDetailModal = async (bullId) => {
    setShowBullDetailModal(true);
    setLoadingBullDetail(true);
    setBullDetail(null);
    try {
      const data = await getBull(bullId);
      setBullDetail(data);
    } catch (error) {
      setBullDetail(null);
    } finally {
      setLoadingBullDetail(false);
    }
  };

  // Función para abrir el modal de inventario de entradas
  const openInventoryModal = async (bull) => {
    setShowInventoryModal(true);
    setLoadingInventory(true);
    setInventoryInputs([]);
    setInventoryBull(bull);
    try {
      const data = await getInputsByBull(bull.id, 0, 100);
      setInventoryInputs(Array.isArray(data) ? data : (data.items || []));
    } catch (error) {
      setInventoryInputs([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  return (
    <div className="container-fluid py-4 bulls-view">
      {/* Título y selección de cliente */}
      <div className="mb-4">
        <h2 className="mb-3">
          <i className="bi bi-database-fill me-2"></i>
          Inventario de semen
        </h2>

        {/* Selección de cliente */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-end">
              {/* <div className="col-md-6">
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
                      <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                      >
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </span>
                  )}
                </div>
                {/* Lista de clientes encontrados
                {clients.length > 0 && (
                  <div className="list-group mt-2 shadow-sm">
                    {clients.map((client) => (
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
              </div> */}
              {/* <div className="col-md-6">
                {selectedClient && (
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="card-title mb-1">
                            Cliente Seleccionado
                          </h5>
                          <h6 className="mb-2">{selectedClient.full_name}</h6>
                          <p className="mb-0 small">
                            <strong>Documento:</strong>{" "}
                            {selectedClient.number_document}
                            <br />
                            <strong>Email:</strong> {selectedClient.email}
                            <br />
                            <strong>Teléfono:</strong> {selectedClient.phone}
                          </p>
                        </div>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={clearSelectedClient}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div> */}
            </div>
          </div>
        </div>

        {/* Filtros solo visibles si hay un cliente seleccionado */}
        {selectedClient && (
          <>
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
                      {races.map((race) => (
                        <option key={race.id} value={race.name}>
                          {race.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* <div className="col-md-3">
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
                  </div> */}

                  {/* <div className="col-md-3">
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
                  </div> */}
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
                </div>
              </div>
            </div>

            {/* Botón para agregar nuevo toro */}
            {/* <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-success"
                onClick={() => setShowNewBullModal(true)}
                disabled={loading}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Toro
              </button>
            </div> */}
          </>
        )}
      </div>

      {/* Tabla de toros */}
      {selectedClient && (
        <>
          <div className="table-responsive rounded-3 border">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th width="10%" style={{fontWeight:"700"}}>ID</th>
                  <th width="10%" style={{fontWeight:"700"}}>Nombre</th>
                  <th width="10%" style={{fontWeight:"700"}}>Registro</th>
                  <th width="10%" style={{fontWeight:"700"}}>Lote</th>
                  <th width="10%" style={{fontWeight:"700"}}>Escalerilla</th>
                  <th width="10%" style={{fontWeight:"700"}}>Descripción</th>
                  <th width="10%" style={{fontWeight:"700"}}>Raza</th>
                  <th width="10%" style={{fontWeight:"700"}}>Sexo</th>
                  <th width="20%" style={{fontWeight:"700"}}>Unidades Disponibles</th>
                  {/* <th width="15%">Estado</th> */}
                  {/* <th width="10%">Acciones</th> */}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      >
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="mt-2">Cargando toros...</p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="7" className="text-center text-danger py-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </td>
                  </tr>
                ) : filteredBulls.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-4">
                      <i className="bi bi-database me-2"></i>
                      {filter.searchQuery ||
                      filter.race ||
                      filter.sex ||
                      filter.status
                        ? "No se encontraron toros con esos criterios"
                        : "No hay toros registrados para este cliente"}
                    </td>
                  </tr>
                ) : (
                  paginatedBulls.map((bull) => {
                    const raceName =
                      races.find((r) => r.id === bull.race_id)?.name ||
                      "Desconocida";
                    const sexName =
                      sexes.find((s) => s.id === bull.sex_id)?.name ||
                      "Desconocido";

                    return (
                      <tr
                        key={bull.id}
                        // onClick={() => navigate(`/bulls/${bull.id}/edit`)}
                        className="cursor-pointer"
                      >
                        <td className="fw-semibold">#{bull.id}</td>
                        <td>{bull.name || "Sin nombre"}</td>
                        <td>{bull.registration_number || bull.register || "Sin registro"}</td>
                        <td>{bull.lote || "Sin registro"}</td>
                        <td>{bull.escalerilla ||"Sin registro"}</td>
                        <td>{bull.description || "Sin registro"}</td>
                        <td>{raceName}</td>
                        <td>{sexName}</td>

                        {/* <td>
                          <span className={`badge ${bull.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                            {bull.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </td> */}
                        {/* <td>
                          <div className="btn-group">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                openBullDetailModal(bull.id);
                              }}
                              title="Ver detalles"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-info ms-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInventoryModal(bull);
                              }}
                              title="Ver inventario"
                            >
                              <i className="bi bi-box-seam"></i>
                            </button>
                            {/* <button
                              className="btn btn-sm btn-outline-danger ms-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteBull(bull.id);
                              }}
                              title="Eliminar toro"
                            >
                              <i className="bi"></i>
                            </button> 
                          </div>
                        </td> */}
                        <td className="text-center align-middle">
                          <span>
                            {bull.total_available}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {filteredBulls.length > pagination.itemsPerPage && (
            <div className="d-flex justify-content-center mt-3">
              <nav aria-label="Paginación de toros">
                <ul className="pagination">
                  <li
                    className={`page-item ${
                      pagination.currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                    >
                      &laquo;
                    </button>
                  </li>

                  {Array.from({
                    length: Math.ceil(
                      filteredBulls.length / pagination.itemsPerPage
                    ),
                  }).map((_, index) => (
                    <li
                      key={index}
                      className={`page-item ${
                        pagination.currentPage === index + 1 ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </button>
                    </li>
                  ))}

                  <li
                    className={`page-item ${
                      pagination.currentPage ===
                      Math.ceil(filteredBulls.length / pagination.itemsPerPage)
                        ? "disabled"
                        : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                    >
                      &raquo;
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Modal para nuevo toro */}
      {showNewBullModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Nuevo Toro para {selectedClient?.full_name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowNewBullModal(false)}
                  disabled={loading}
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
                      onChange={(e) =>
                        setNewBullData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
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
                      onChange={(e) =>
                        setNewBullData((prev) => ({
                          ...prev,
                          register: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Lote</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lote"
                      value={newBullData.lote}
                      onChange={(e) =>
                        setNewBullData((prev) => ({
                          ...prev,
                          lote: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Escalerilla</label>
                    <input
                      type="text"
                      className="form-control"
                      name="escalerilla"
                      value={newBullData.escalerilla}
                      onChange={(e) =>
                        setNewBullData((prev) => ({
                          ...prev,
                          escalerilla: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descripcion</label>
                    <input
                      type="text"
                      className="form-control"
                      name="description"
                      value={newBullData.description}
                      onChange={(e) =>
                        setNewBullData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Raza</label>
                    <select
                      className="form-select"
                      name="race_id"
                      value={newBullData.race_id}
                      onChange={(e) =>
                        setNewBullData((prev) => ({
                          ...prev,
                          race_id: parseInt(e.target.value) || 0,
                        }))
                      }
                      required
                    >
                      <option value="">Seleccione una raza</option>
                      {races.map((race) => (
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
                      onChange={(e) =>
                        setNewBullData((prev) => ({
                          ...prev,
                          sex_id: parseInt(e.target.value) || 0,
                        }))
                      }
                      required
                    >
                      <option value="">Seleccione un sexo</option>
                      {sexes.map((sex) => (
                        <option key={sex.id} value={sex.id}>
                          {sex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      name="status"
                      value={newBullData.status}
                      onChange={(e) => setNewBullData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="active">Activo</option>
                      <option value="inactive">Inactivo</option>
                    </select>
                  </div> */}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowNewBullModal(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
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

      {/* Modal para registrar entradas */}
      {showInputModal && selectedBull && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Entradas del Toro: {selectedBull.name || "Sin nombre"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowInputModal(false)}
                  disabled={inputLoading || loadingInputs}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4">
                    <div className="card">
                      <div className="card-header bg-primary text-white">
                        <h6 className="mb-0">Registrar Nueva Entrada</h6>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleQuickInput}>
                          <div className="mb-3">
                            <label className="form-label">
                              Cantidad Recibida (unidades)
                            </label>
                            <input
                              type="number"
                              className="form-control"
                              value={quantityReceived}
                              onChange={(e) =>
                                setQuantityReceived(e.target.value)
                              }
                              placeholder="Ej: 10.5"
                              min="0.1"
                              step="0.1"
                              required
                              disabled={inputLoading}
                            />
                          </div>
                          <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={inputLoading}
                          >
                            {inputLoading ? (
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                              ></span>
                            ) : (
                              <i className="bi bi-plus-circle me-2"></i>
                            )}
                            Registrar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-8">
                    <div className="card">
                      <div className="card-header bg-light">
                        <h6 className="mb-0">Historial de Entradas</h6>
                      </div>
                      <div className="card-body p-0">
                        {loadingInputs ? (
                          <div className="text-center py-4">
                            <div
                              className="spinner-border text-primary"
                              role="status"
                            >
                              <span className="visually-hidden">
                                Cargando...
                              </span>
                            </div>
                            <p className="mt-2 text-muted">
                              Cargando entradas...
                            </p>
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
                                  <th>Cantidad</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bullInputs.map((input) => (
                                  <tr key={input.id}>
                                    <td>{input.id}</td>
                                    <td>
                                      {input.created_at
                                        ? new Date(
                                            input.created_at
                                          ).toLocaleDateString("es-CO", {
                                            timeZone: "UTC",
                                          })
                                        : "N/A"}
                                    </td>
                                    <td>
                                      {parseFloat(
                                        input.quantity_received
                                      ).toFixed(1)}{" "}
                                      unidades
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
                  disabled={inputLoading || loadingInputs}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalles del toro */}
      {showBullDetailModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Detalles del Toro</h5>
                <button type="button" className="btn-close" onClick={() => setShowBullDetailModal(false)} disabled={loadingBullDetail}></button>
              </div>
              <div className="modal-body">
                {loadingBullDetail ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2 text-muted">Cargando detalles...</p>
                  </div>
                ) : bullDetail ? (
                  <div>
                    <p><strong>ID:</strong> {bullDetail.id}</p>
                    <p><strong>Nombre:</strong> {bullDetail.name}</p>
                    <p><strong>Registro:</strong> {bullDetail.registration_number || bullDetail.register}</p>
                    <p><strong>Lote:</strong> {bullDetail.lote}</p>
                    <p><strong>Escalerilla:</strong> {bullDetail.escalerilla}</p>
                    <p><strong>Descripción:</strong> {bullDetail.description}</p>
                    <p><strong>Raza:</strong> {races.find(r => r.id === bullDetail.race_id)?.name || 'Desconocida'}</p>
                    <p><strong>Sexo:</strong> {sexes.find(s => s.id === bullDetail.sex_id)?.name || 'Desconocido'}</p>
                    {/* Puedes agregar más campos si lo deseas */}
                  </div>
                ) : (
                  <div className="text-danger">No se pudo cargar la información del toro.</div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowBullDetailModal(false)} disabled={loadingBullDetail}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de inventario de entradas */}
      {showInventoryModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Inventario de Entradas del Toro: {inventoryBull?.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowInventoryModal(false)} disabled={loadingInventory}></button>
              </div>
              <div className="modal-body">
                {loadingInventory ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2 text-muted">Cargando inventario...</p>
                  </div>
                ) : inventoryInputs.length === 0 ? (
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
                          <th>Disponibilidad</th>
                          <th>Cantidad recibida</th>
                          <th>Cantidad utilizada</th>
                          <th>Lote</th>
                          <th>Escalerilla</th>
                          <th>Número de registro</th>
                          <th>Nombre del toro</th>
                          <th>Fecha de ingreso</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryInputs.map((input) => (
                          <tr key={input.id}>
                            <td>{input.id}</td>
                            <td>{input.total ?? '-'}</td>
                            <td>{input.quantity_received ?? '-'}</td>
                            <td>{input.quantity_taken ?? '-'}</td>
                            <td>{input.lote ?? '-'}</td>
                            <td>{input.escalarilla ?? '-'}</td>
                            <td>{input.bull.registration_number ?? '-'}</td>
                            <td>{inventoryBull?.name ?? '-'}</td>
                            <td>{input.created_at ? new Date(input.created_at).toLocaleDateString('es-CO', { timeZone: 'UTC' }) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowInventoryModal(false)} disabled={loadingInventory}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BullsByClient;
