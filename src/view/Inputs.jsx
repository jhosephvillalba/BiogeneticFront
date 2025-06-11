import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getBull, filterBulls } from "../Api/bulls";
import { getInputsByBull, updateInput, getInputsByUser } from "../Api/inputs";
import { getRaceById } from "../Api/races";
import { createOutput } from "../Api/outputs";
import { filterUsers } from "../Api/users";
import { getCurrentUser } from "../Api/auth";

const Inputs = () => {
  const navigate = useNavigate();

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
  const [itemsPerPage] = useState(5);
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

  // Función para formatear la fecha al formato ISO 8601 completo
  const formatDate = (dateString) => {
    if (!dateString) return undefined;

    try {
      // Crear un objeto Date a partir del string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return undefined; // Fecha inválida

      // Formatear como YYYY-MM-DDTHH:MM:SS.sssZ para cumplir con ISO 8601 completo
      return date.toISOString();
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return undefined;
    }
  };

const roundToDecimal = (number) => {
  // Manejar casos especiales como 0.1 directamente
  if (Math.abs(number - 0.1) < 0.000001) return 0.1;
  
  // Redondear a 10 decimales primero para evitar errores de precisión
  const rounded = Math.round(number * 10000000000) / 10000000000;
  // Luego redondear a 1 decimal para presentación
  return Math.round(rounded * 10) / 10;
};

const isEqualWithTolerance = (a, b, tolerance = 0.000001) => {
  return Math.abs(a - b) < tolerance;
};

  // Función para comparar números con tolerancia
  const isGreaterThan = (a, b) => {
    // Añadimos una pequeña tolerancia para la comparación
    const tolerance = 0.0001;
    return a - b > tolerance;
  };

  // Función para cargar usuarios con rol de cliente
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
        filters.full_name = searchTerm.trim();
        filters.email = searchTerm.trim();
        filters.number_document = searchTerm.trim();
      }

      console.log(
        "Enviando filtros a la API:",
        filters,
        "skip:",
        skip,
        "limit:",
        itemsPerPage
      ); // Debug

      const response = await filterUsers(filters, skip, itemsPerPage);

      console.log("Respuesta de la API:", response); // Debug

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

  // Función para cargar los toros desde la API
  const loadBulls = async (reset = false) => {
    try {
      setLoading(true);
      if (reset) {
        setError(null);
        setCurrentPage(1);
      }

      // Creamos un objeto para los filtros no vacíos
      const filtersToApply = {};

      if (searchTerm && searchTerm.trim() !== "") {
        filtersToApply.search = searchTerm.trim();
      }

      if (startDate && endDate) {
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        if (formattedStartDate && formattedEndDate) {
          filtersToApply.date_from = formattedStartDate;
          filtersToApply.date_to = formattedEndDate;
        }
      }

      console.log("Preparando filtros para la API:", filtersToApply);

      let response;
      // Si no hay filtros, usar getBulls en lugar de filterBulls
      try {
        if (Object.keys(filtersToApply).length === 0) {
          response = await filterBulls(
            {},
            (currentPage - 1) * itemsPerPage,
            itemsPerPage
          );
        } else {
          console.log("Filtros finales enviados a la API:", filtersToApply);
          response = await filterBulls(
            filtersToApply,
            (currentPage - 1) * itemsPerPage,
            itemsPerPage
          );
        }

        console.log("Respuesta completa:", response);

        // Verifica la estructura de la respuesta y extrae los datos correctamente
        let bullsData = [];
        let totalCount = 0;

        if (Array.isArray(response)) {
          // Si la respuesta es un array directo
          bullsData = response;
          totalCount = response.length;
        } else if (
          response &&
          response.results &&
          Array.isArray(response.results)
        ) {
          // Si la respuesta tiene formato {results: [...], total: X}
          bullsData = response.results;
          totalCount = response.total || bullsData.length;
        } else if (
          response &&
          response.items &&
          Array.isArray(response.items)
        ) {
          // Si la respuesta tiene formato {items: [...], total: X}
          bullsData = response.items;
          totalCount = response.total || bullsData.length;
        } else if (response && typeof response === "object") {
          // Si es otro tipo de objeto, intenta extraer datos útiles
          console.log("Formato de respuesta diferente:", response);
          bullsData = [];
          totalCount = 0;
        }

        console.log("Datos de toros extraídos:", bullsData);
        setBulls(bullsData || []);
        setTotalItems(totalCount || 0);
      } catch (innerError) {
        console.error("Error específico en la llamada API:", innerError);
        throw innerError;
      }
    } catch (error) {
      console.error("Error específico del filtro:", error);
      if (error.response) {
        console.error("Detalles del error:", error.response.data);
      }
      console.error("Error al cargar toros:", error);
      setError(
        "No se pudieron cargar los datos. Por favor, intente nuevamente."
      );
      setBulls([]);
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

  // Handle search button click
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Iniciando búsqueda con término:", searchTerm); // Debug
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

  // Limpiar filtros
  const handleClearFilters = () => {
    console.log("Limpiando filtros"); // Debug
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

  // Función para normalizar números a 1 decimal
  const normalizeNumber = (number) => {
  if (typeof number !== "number" || isNaN(number)) {
    return NaN;
  }
  
  // Solución 1: Usar toFixed y parseFloat
  const fixed = parseFloat(number.toFixed(10)); // Primero fijamos muchos decimales
  return parseFloat(fixed.toFixed(1)); // Luego reducimos a 1 decimal
  
  // Solución 2: Usar redondeo matemático con tolerancia
  // const rounded = Math.round(Math.round(number * 100) / 10) / 10;
  // return rounded;
  };

  // Función para actualizar la cantidad utilizada
  const handleUpdateQuantity = async (input, newQuantity) => {
    try {
      setUpdateLoading(true);
      setUpdateError(null);

      // Normalizar todas las cantidades a 1 decimal fijo
      const receivedQty = normalizeNumber(input.quantity_received || 0);
      const currentQty = normalizeNumber(input.quantity_taken || 0);
      const newQty = normalizeNumber(newQuantity);
      const currentTotal = normalizeNumber(
        input.total || input.quantity_received || 0
      );

      console.log("Cantidades normalizadas:", {
        receivedQty,
        currentQty,
        newQty,
        currentTotal,
      });

      // Validaciones básicas
      if (isNaN(newQty) || newQty <= 0) {
        throw new Error("La cantidad debe ser un número positivo");
      }

      if (isEqualWithTolerance(newQty, receivedQty)) {
        throw new Error(
          `La cantidad (${newQty}) no puede ser mayor que la cantidad recibida (${receivedQty})`
        );
      }

      // Calcular la diferencia
      const difference = normalizeNumber(newQty - currentQty);

      console.log("Diferencia calculada:", difference);

      if (difference <= 0) {
        throw new Error(
          "La nueva cantidad debe ser mayor que la cantidad actual"
        );
      }

      if (difference > currentTotal) {
        throw new Error(
          `No hay suficiente cantidad disponible. Disponible: ${currentTotal}, Solicitado: ${difference}`
        );
      }

      // Preparar los datos de la salida con cantidades normalizadas
      const outputData = {
        input_id: input.id,
        quantity_output: difference,
        output_date: new Date().toISOString(),
        remark: "Salida registrada desde edición",
        bull_id: input.bull_id,
        user_id: selectedUser.id,
      };

      console.log("Datos de salida:", outputData);

      // Registrar la salida
      const outputResponse = await createOutput(input.id, outputData);
      console.log("Respuesta de la API:", outputResponse);

      // Actualizar la lista de entradas
      const updatedInputs = bullInputs.map((item) => {
        if (item.id === input.id) {
          const newTotal = normalizeNumber(currentTotal - difference);
          return {
            ...item,
            quantity_taken: newQty,
            total: newTotal,
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      });

      setBullInputs(updatedInputs);
      setEditingInputId(null);
      setEditValue("");
      setUpdateError(null);
    } catch (error) {
      console.error("Error completo:", error);
      setUpdateError(error.message || "Error al actualizar la cantidad");
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
          <div className="col-md-8">
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
          <div className="col-md-4">
            <div className="d-grid gap-2">
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
                      Anterior
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (number) => (
                      <li
                        key={number}
                        className={`page-item ${
                          currentPage === number ? "active" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() => paginate(number)}
                        >
                          {number}
                        </button>
                      </li>
                    )
                  )}

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
                      Siguiente
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
                      <th>Recibida</th>
                      <th>Utilizada</th>
                      <th>Disponible</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bullInputs.length > 0 ? (
                      bullInputs.map((input) => {
                        const received = roundToDecimal(
                          parseFloat(input.quantity_received || 0)
                        );
                        const used = roundToDecimal(
                          parseFloat(input.quantity_taken || 0)
                        );
                        const available = roundToDecimal(
                          parseFloat(
                            input.total || input.quantity_received || 0
                          )
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
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td>{received.toFixed(1)}</td>
                            <td>
                              {editingInputId === input.id ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={editValue}
                                  onChange={(e) => {
                                    const value = normalizeNumber(
                                      e.target.value || 0
                                    );
                                    setEditValue(value);
                                  }}
                                  step="0.1"
                                  min={used}
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
                                ).toLocaleDateString()
                              : "Desconocida"}
                          </td>
                        </tr>
                        <tr>
                          <th>Última actualización:</th>
                          <td>
                            {selectedBull.updated_at
                              ? new Date(
                                  selectedBull.updated_at
                                ).toLocaleDateString()
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
                      <th>Cantidad Recibida (ml)</th>
                      <th>Cantidad Utilizada (ml)</th>
                      <th>Disponible (ml)</th>
                      <th>Última Salida</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bullInputs.map((input) => {
                      const received = roundToDecimal(
                        parseFloat(input.quantity_received || 0)
                      );
                      const used = roundToDecimal(
                        parseFloat(input.quantity_taken || 0)
                      );
                      const available =
                        input.quantity_available !== undefined
                          ? roundToDecimal(parseFloat(input.quantity_available))
                          : received - used;

                      // Calcular diferencia si está editando
                      const editingDifference =
                        editingInputId === input.id
                          ? roundToDecimal(parseFloat(editValue || 0)) - used
                          : 0;

                      return (
                        <tr key={input.id}>
                          <td>{input.id}</td>
                          <td>
                            {input.created_at
                              ? new Date(input.created_at).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td>{received.toFixed(1)}</td>
                          <td>
                            {editingInputId === input.id ? (
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={editValue}
                                onChange={(e) => {
                                  const value = normalizeNumber(
                                    e.target.value || 0
                                  );
                                  setEditValue(value);
                                }}
                                step="0.1"
                                min="0"
                                max={received}
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
                                    roundToDecimal(parseFloat(editValue || 0))
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
