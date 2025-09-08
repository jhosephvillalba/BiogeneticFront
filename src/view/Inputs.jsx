import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBull } from "../Api/bulls";
import { getInputsByBull, getInputsByUser, updateInput } from "../Api/inputs";
import { getRaceById } from "../Api/races";
import { searchUsers } from "../Api/users";
import { createOutput } from "../Api/outputs";

const Inputs = () => {
  const navigate = useNavigate();

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [bullFilter, setBullFilter] = useState("");

  // State for data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for bull details
  const [selectedBull, setSelectedBull] = useState(null);
  const [loadingBull, setLoadingBull] = useState(false);
  const [bullInputs, setBullInputs] = useState([]);
  const [loadingBullInputs, setLoadingBullInputs] = useState(false);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // State for race details
  const [raceDetails, setRaceDetails] = useState(null);
  const [loadingRace, setLoadingRace] = useState(false);

  // Estado para el usuario seleccionado
  const [selectedUser, setSelectedUser] = useState(null);

  // Estado para edición de cantidad
  const [editingInputId, setEditingInputId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Nuevo estado para lista de toros
  const [availableBulls, setAvailableBulls] = useState([]);

  const loadUsers = async (reset = false) => {
    try {
      setLoading(true);
      if (reset) {
        setError(null);
        setCurrentPage(1);
      }

      const skip = (currentPage - 1) * itemsPerPage;

      // Construir objeto de filtros según la API
      const filters = {};

      // Siempre incluir el rol de cliente
      filters.role_id = 3;

      // Añadir término de búsqueda si existe
      if (searchTerm && searchTerm.trim() !== "") {
        // Intentar buscar en múltiples campos
        filters.q = searchTerm.trim();
      }

      const response = await searchUsers(filters, skip, itemsPerPage);

      // console.log("Respuesta de la API:", response); // Debug

      // Manejar la respuesta
      if (response && response.items) {
        console.log("Usuarios encontrados:", response.items.length);
        setUsers(response.items);
        setTotalItems(response.total || response.items.length);
      } else if (Array.isArray(response)) {
        console.log("Array de usuarios:", response.length);
        setUsers(response);
        setTotalItems(response.length);
      } else {
        console.log("Formato de respuesta inesperado:", response);
        setUsers([]);
        setTotalItems(0);
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      if (error.response) {
        console.error("Detalles del error:", error.response.data);
      }
      setError(
        "No se pudieron cargar los usuarios. Por favor, intente nuevamente."
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos del toro seleccionado y sus entradas
  const loadBullDetails = async (bullId) => {
    if (!bullId) {
      setSelectedBull(null);
      setBullInputs([]);
      setRaceDetails(null);
      return;
    }

    setLoadingBull(true);
    setLoadingBullInputs(true);
    setLoadingRace(true);

    try {
      // Obtener datos del toro
      const bullDetails = await getBull(bullId);
      setSelectedBull(bullDetails);

      console.log("Datos del toro obtenidos:", bullDetails);

      // Cargar los detalles de la raza si el toro tiene race_id
      if (bullDetails.race_id) {
        try {
          const raceData = await getRaceById(bullDetails.race_id);
          setRaceDetails(raceData);
          console.log("Datos de la raza:", raceData);
        } catch (raceError) {
          console.error("Error al cargar datos de la raza:", raceError);
        }
      }

      // Obtener entradas del toro específico
      const inputs = await getInputsByBull(bullId, 0, 100);
      console.log("Entradas del toro obtenidas:", inputs);

      // Formatear las entradas correctamente
      let formattedInputs = [];
      if (Array.isArray(inputs)) {
        formattedInputs = inputs;
      } else if (inputs && inputs.items) {
        formattedInputs = inputs.items;
      } else if (
        inputs &&
        typeof inputs === "object" &&
        !Array.isArray(inputs)
      ) {
        formattedInputs = [inputs]; // Si es un único objeto
      }

      console.log("Entradas formateadas:", formattedInputs);

      setBullInputs(formattedInputs);
    } catch (error) {
      console.error("Error al cargar detalles del toro:", error);
      setError("No se pudieron cargar los detalles del toro seleccionado.");
      setBullInputs([]);
      setRaceDetails(null);
    } finally {
      setLoadingBull(false);
      setLoadingBullInputs(false);
      setLoadingRace(false);
    }
  };

  // Función para cargar los toros disponibles
  const loadAvailableBulls = async () => {
    try {
      if (!selectedUser) return;
      
      // Obtener los toros únicos de las entradas del cliente
      const uniqueBulls = [...new Set(bullInputs.map(input => input.bull?.id))]
        .filter(id => id) // Filtrar IDs nulos o undefined
        .map(id => {
          const input = bullInputs.find(input => input.bull?.id === id);
          return input.bull;
        });

      setAvailableBulls(uniqueBulls);
    } catch (error) {
      console.error("Error al cargar los toros:", error);
    }
  };

  // Efecto para cargar datos iniciales y cuando cambia la página
  useEffect(() => {
    loadUsers(false);
  }, [currentPage]);

  // Efecto para cargar datos del toro cuando se selecciona uno
  useEffect(() => {
    if (selectedBull?.id) {
      loadBullDetails(selectedBull.id);
    } else {
      setBullInputs([]);
    }
  }, [selectedBull?.id]);

  // Efecto para cargar los toros al montar el componente
  useEffect(() => {
    loadAvailableBulls();
  }, []);

  // Efecto para cargar los toros cuando cambian las entradas del cliente
  useEffect(() => {
    loadAvailableBulls();
  }, [bullInputs, selectedUser]);

  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault();
    // console.log("Iniciando búsqueda con término:", searchTerm); // Debug
    loadUsers(true);
  };

  // Handle user selection
  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSelectedBull(null);
    setBullInputs([]);
    setLoading(true);

    try {
      const inputs = await getInputsByUser(user.id);
      setBullInputs(Array.isArray(inputs) ? inputs : inputs.items || []);
    } catch (error) {
      console.error("Error al cargar las entradas del usuario:", error);
      setError("No se pudieron cargar las entradas del usuario");
      setBullInputs([]);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    // console.log("Limpiando filtros"); // Debug
    setSearchTerm("");
    setSelectedUser(null);
    setSelectedBull(null);
    setBullInputs([]);
    setError(null);
    setCurrentPage(1);
    loadUsers(true);
  };

  // Pagination logic
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Función simplificada para manejar decimales
  const formatDecimal = (num) => {
  const value = parseFloat(num) || 0;
  return parseFloat(value.toFixed(1)); // Redondear a 1 decimal sin error de precisión
};

  // Manejador de cambio para el input de edición
  const handleEditChange = (e) => {
    const rawValue = e.target.value;
    // Permitir valores vacíos temporalmente para mejor UX
    if (rawValue === "") {
      setEditValue("");
      return;
    }

    const value = parseFloat(rawValue);
    if (!isNaN(value)) {
      setEditValue(value >= 0 ? value : 0);
    }
  };

  const handleUpdateQuantity = async (input) => {
    try {
      setUpdateLoading(true);
      setUpdateError(null);

      const newQty = formatDecimal(editValue);
      const received = formatDecimal(input.quantity_received);

      // Validaciones
      if (newQty < input.quantity_taken) {
        throw new Error("No puedes reducir la cantidad utilizada");
      }

      if (newQty > received) {
        throw new Error(`No puedes tomar más de ${received} unidades`);
      }

      // Actualización optimista
      setBullInputs((prev) =>
        prev.map((item) =>
          item.id === input.id
            ? { ...item, quantity_taken: newQty, total: received - newQty }
            : item
        )
      );

      // Llamadas a API
      const updateRes = await updateInput(input.id, { quantity_taken: newQty });
      await createOutput(input.id, {
        quantity_output: formatDecimal(newQty - input.quantity_taken),
        output_date: new Date().toISOString(),
        remark: "Registro automático",
      });

      // Recarga final para sincronización
      const refreshed = selectedBull
        ? await getInputsByBull(selectedBull.id)
        : await getInputsByUser(selectedUser.id);

      setBullInputs(
        Array.isArray(refreshed) ? refreshed : refreshed.items || []
      );

      setEditingInputId(null);
    } catch (error) {
      setUpdateError(error.message);
      // Revertir cambios si falla
      setBullInputs((prev) => [...prev]);
    } finally {
      setUpdateLoading(false);
    }
  };

  // Manejadores para la edición
  const handleStartEdit = (input) => {
    setEditingInputId(input.id);
    setEditValue(input.quantity_taken?.toString() || "0");
    setUpdateError(null);
  };

  const handleCancelEdit = () => {
    setEditingInputId(null);
    setEditValue("");
    setUpdateError(null);
  };

  // Función para filtrar las entradas
  const getFilteredInputs = () => {
    if (!bullInputs) return [];
    
    return bullInputs.filter(input => {
      const received = formatDecimal(parseFloat(input.quantity_received || 0));
      const used = formatDecimal(parseFloat(input.quantity_taken || 0));
      const available = received - used;
      
      // Filtro por disponibilidad
      if (availabilityFilter === "available" && available <= 0) return false;
      if (availabilityFilter === "depleted" && available > 0) return false;
      
      // Filtro por toro
      if (bullFilter && input.bull?.id !== parseInt(bullFilter)) return false;
      
      return true;
    });
  };

  return (
    <div className="container-fluid p-4">
      {/* Mostrar errores si existen */}
      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show mb-4"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-4 p-3 bg-light rounded">
        <h4 className="mb-3">Filtrar Clientes</h4>
        <form onSubmit={handleSearch} className="row g-3 align-items-end">
          <div className="col-md-9">
            <label htmlFor="searchTerm" className="form-label">
              Búsqueda
            </label>
            <input
              type="text"
              className="form-control"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, email o documento..."
            />
          </div>
          <div className="col-md-3">
            <div className="d-flex gap-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Buscando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-search me-1"></i>
                    Buscar
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClearFilters}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-1"></i>
                Limpiar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results Table */}
      <div className="mt-4">
        <h4 className="mb-3">Clientes Disponibles</h4>
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
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        style={{
                          cursor: "pointer",
                          backgroundColor:
                            selectedUser?.id === user.id
                              ? "#e8f4ff"
                              : "inherit",
                        }}
                        className={
                          selectedUser?.id === user.id ? "selected-row" : ""
                        }
                      >
                        <td>{user.id}</td>
                        <td>{user.full_name}</td>
                        <td>{user.email}</td>
                        <td>{user.number_document || "No disponible"}</td>
                        <td>{user.phone || "No disponible"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        <span className="text-muted">
                          <i className="bi bi-inbox me-2"></i>
                          No se encontraron clientes
                        </span>
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
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i> Anterior
                    </button>
                  </li>

                  {/* Mostrar números de página con elipsis */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Mostrar siempre la primera página, la última y las páginas cercanas a la actual
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 2
                      );
                    })
                    .map((page, index, array) => {
                      // Agregar elipsis cuando hay saltos en la secuencia
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return (
                          <React.Fragment key={`ellipsis-${page}`}>
                            <li className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                            <li
                              className={`page-item ${
                                currentPage === page ? "active" : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() => paginate(page)}
                              >
                                {page}
                              </button>
                            </li>
                          </React.Fragment>
                        );
                      }
                      return (
                        <li
                          key={page}
                          className={`page-item ${
                            currentPage === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => paginate(page)}
                          >
                            {page}
                          </button>
                        </li>
                      );
                    })}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            )}

            <div className="text-muted text-center mt-2 mb-4">
              Mostrando {users.length} de {totalItems} clientes
            </div>
          </>
        )}
      </div>

      {/* Tabla de Entradas del Usuario Seleccionado */}
      {selectedUser && (
        <div className="mt-4">
          <div className="card">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Entradas Registradas - Cliente: {selectedUser.full_name}
              </h5>
              <div className="d-flex gap-3">
                {/* Filtro de Disponibilidad */}
                <div className="form-group">
                  <select
                    className="form-select"
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                  >
                    <option value="all">Todos</option>
                    <option value="available">Disponibles</option>
                    <option value="depleted">Agotados</option>
                  </select>
                </div>
                
                {/* Filtro de Toro */}
                <div className="form-group">
                  <select
                    className="form-select"
                    value={bullFilter}
                    onChange={(e) => setBullFilter(e.target.value)}
                  >
                    <option value="">Todos los toros</option>
                    {availableBulls.map((bull) => (
                      <option key={bull.id} value={bull.id}>
                        {bull.name} - {bull.register || "Sin registro"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {updateError && (
                <div
                  className="alert alert-danger alert-dismissible fade show m-3"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {updateError}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setUpdateError(null)}
                  ></button>
                </div>
              )}
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Toro</th>
                      <th>Fecha</th>
                      <th>Lote</th>
                      <th>Escalerilla</th>
                      <th>Recibida</th>
                      <th>Utilizada</th>
                      <th>Disponible</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredInputs().length > 0 ? (
                      getFilteredInputs().map((input) => {
                        const received = formatDecimal(
                          parseFloat(input.quantity_received || 0)
                        );
                        const used = formatDecimal(
                          parseFloat(input.quantity_taken || 0)
                        );
                        const available = formatDecimal(
                          parseFloat(input.total)
                        );

                        return (
                          <tr key={input.id}>
                            <td>{input.id}</td>
                            <td>
                              {input.bull?.name || "N/A"}
                              <br />
                              <small className="text-muted">
                                Reg: {input.bull?.register || "N/A"}
                              </small>
                            </td>
                            <td>
                              {input.created_at
                                ? new Date(
                                    input.created_at
                                  ).toLocaleDateString('es-CO', {
timeZone: 'UTC' })
                                : "N/A"}
                            </td>
                            <td>{input.lote || "N/A"}</td>
                            <td>{input.escalarilla || "N/A"}</td>
                            <td>{received.toFixed(1)}</td>
                            <td>
                              {editingInputId === input.id ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={editValue}
                                  onChange={(e) => {
                                    // Permitir cualquier valor numérico positivo
                                    const value =
                                      Math.max(0, parseFloat(e.target.value)) ||
                                      0;
                                    console.log({ value: value });
                                    setEditValue(value);
                                  }}
                                  step={0.1}
                                  min={0}
                                  max={received}
                                />
                              ) : (
                                used.toFixed(1)
                              )}
                            </td>
                            <td>
                              <span
                                className={
                                  available === 0
                                    ? "text-danger fw-bold"
                                    : "text-success"
                                }
                              >
                                {available.toFixed(1)}
                                {available === 0 && (
                                  <span className="badge bg-danger ms-2">
                                    Agotado
                                  </span>
                                )}
                              </span>
                            </td>
                            <td>
                              {editingInputId === input.id ? (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-success"
                                    onClick={() =>
                                      handleUpdateQuantity(input, editValue)
                                    }
                                    disabled={updateLoading}
                                  >
                                    {updateLoading ? (
                                      <span className="spinner-border spinner-border-sm" />
                                    ) : (
                                      <i className="bi bi-check" />
                                    )}
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={handleCancelEdit}
                                    disabled={updateLoading}
                                  >
                                    <i className="bi bi-x" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleStartEdit(input)}
                                  disabled={available <= 0}
                                  title={
                                    available <= 0
                                      ? "No hay cantidad disponible"
                                      : "Editar cantidad utilizada"
                                  }
                                >
                                  <i className="bi bi-pencil" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4">
                          <span className="text-muted">
                            <i className="bi bi-inbox me-2"></i>
                            No hay entradas registradas para este cliente
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detalle del Toro Seleccionado */}
      {selectedBull && (
        <div className="mt-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                Detalle del Toro{" "}
                {loadingBull ? "" : selectedBull?.name || "Seleccionado"}
                {loadingBull && (
                  <span
                    className="spinner-border spinner-border-sm ms-2"
                    role="status"
                  ></span>
                )}
              </h5>
            </div>
            <div className="card-body">
              {loadingBull ? (
                <div className="text-center py-3">
                  <div
                    className="spinner-border text-primary"
                    role="status"
                  ></div>
                  <p className="mt-2 text-muted">Cargando detalles...</p>
                </div>
              ) : !selectedBull ? (
                <p className="text-center text-muted">
                  No se pudo cargar la información del toro
                </p>
              ) : (
                <div className="row">
                  <div className="col-md-6">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th width="40%">ID:</th>
                          <td>{selectedBull.id}</td>
                        </tr>
                        <tr>
                          <th>Nombre:</th>
                          <td>{selectedBull.name}</td>
                        </tr>
                        <tr>
                          <th>Registro:</th>
                          <td>{selectedBull.register || "Sin registro"}</td>
                        </tr>
                        <tr>
                          <th>Raza:</th>
                          <td>
                            {loadingRace ? (
                              <span
                                className="spinner-border spinner-border-sm"
                                role="status"
                              ></span>
                            ) : raceDetails ? (
                              raceDetails.name
                            ) : (
                              selectedBull.race_name || "Desconocida"
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="col-md-6">
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <th width="40%">Estado:</th>
                          <td>
                            <span
                              className={`badge ${
                                selectedBull.status === "Active"
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
                            >
                              {selectedBull.status === "Active"
                                ? "Activo"
                                : "Inactivo"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <th>Sexo:</th>
                          <td>{selectedBull.sex_name || "No especificado"}</td>
                        </tr>
                        <tr>
                          <th>Fecha Registro:</th>
                          <td>
                            {selectedBull.created_at
                              ? new Date(
                                  selectedBull.created_at
                                ).toLocaleDateString('es-CO', {
timeZone: 'UTC' })
                              : "Desconocida"}
                          </td>
                        </tr>
                        <tr>
                          <th>Última actualización:</th>
                          <td>
                            {selectedBull.updated_at
                              ? new Date(
                                  selectedBull.updated_at
                                ).toLocaleDateString('es-CO', {
timeZone: 'UTC' })
                              : "Desconocida"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Información del usuario */}
                  {selectedBull.user && (
                    <div className="col-12 mt-3">
                      <h6 className="border-bottom pb-2">
                        Información del Propietario
                      </h6>
                      <div className="row">
                        <div className="col-md-6">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <th width="40%">Nombre:</th>
                                <td>{selectedBull.user.full_name}</td>
                              </tr>
                              <tr>
                                <th>Documento:</th>
                                <td>{selectedBull.user.number_document}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <div className="col-md-6">
                          <table className="table table-sm">
                            <tbody>
                              <tr>
                                <th width="40%">Email:</th>
                                <td>{selectedBull.user.email}</td>
                              </tr>
                              <tr>
                                <th>Teléfono:</th>
                                <td>
                                  {selectedBull.user.phone || "No disponible"}
                                </td>
                              </tr>
                              <tr>
                                <th>Especialidad:</th>
                                <td>
                                  {selectedBull.user.specialty ||
                                    "No especificada"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabla de Entradas del Toro */}
          <div className="card mt-4">
            <div className="card-header">
              <h5 className="mb-0">Historial de Entradas</h5>
            </div>
            <div className="card-body p-0">
              {updateError && (
                <div
                  className="alert alert-danger alert-dismissible fade show m-2"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {updateError}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setUpdateError(null)}
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Lote</th>
                      <th>Canastilla</th>
                      <th>Cantidad Recibida (Unidades)</th>
                      <th>Cantidad Utilizada (Unidades)</th>
                      <th>Disponible (Unidades)</th>
                      <th>Última Salida</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bullInputs.map((input) => {
                      const received = formatDecimal(
                        parseFloat(input.quantity_received || 0)
                      );
                      const used = formatDecimal(
                        parseFloat(input.quantity_taken || 0)
                      );
                      const available =
                        input.quantity_available !== undefined
                          ? formatDecimal(parseFloat(input.quantity_available))
                          : received - used;

                      // Calcular diferencia si está editando
                      const editingDifference =
                        editingInputId === input.id
                          ? formatDecimal(parseFloat(editValue || 0)) - used
                          : 0;

                      return (
                        <tr key={input.id}>
                          <td>{input.id}</td>
                          <td>
                            {input.created_at
                              ? new Date(input.created_at).toLocaleDateString('es-CO', {
timeZone: 'UTC' })
                              : "N/A"}
                          </td>
                          <td>{input.lot || "N/A"}</td>
                          <td>{input.basket || "N/A"}</td>
                          <td>{received.toFixed(1)}</td>
                          <td>
                            {editingInputId === input.id ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editValue}
                                onChange={handleEditChange}
                                step="0.1"
                                min={input.quantity_taken}
                                max={input.quantity_received}
                                onKeyPress={(e) =>
                                  e.key === "Enter" &&
                                  handleUpdateQuantity(input)
                                }
                              />
                            ) : (
                              used.toFixed(1)
                            )}
                          </td>
                          <td>
                            <span
                              className={
                                available <= 0
                                  ? "text-danger fw-bold"
                                  : "text-success"
                              }
                            >
                              {editingInputId === input.id
                                ? (
                                    received -
                                    formatDecimal(parseFloat(editValue || 0))
                                  ).toFixed(1)
                                : available.toFixed(1)}
                              {available <= 0 && (
                                <span className="badge bg-danger ms-2">
                                  Agotado
                                </span>
                              )}
                            </span>
                          </td>
                          <td>
                            {editingInputId === input.id ? (
                              <>
                                <button
                                  className="btn btn-sm btn-success me-1"
                                  onClick={() =>
                                    handleUpdateQuantity(input, editValue)
                                  }
                                  disabled={updateLoading}
                                >
                                  {updateLoading ? (
                                    <span
                                      className="spinner-border spinner-border-sm"
                                      role="status"
                                    ></span>
                                  ) : (
                                    <i className="bi bi-check"></i>
                                  )}
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={handleCancelEdit}
                                  disabled={updateLoading}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </>
                            ) : (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => handleStartEdit(input)}
                                disabled={available <= 0}
                                title={
                                  available <= 0
                                    ? "No hay cantidad disponible"
                                    : "Editar cantidad utilizada"
                                }
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inputs;
