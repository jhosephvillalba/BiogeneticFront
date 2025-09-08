import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faCheck } from "@fortawesome/free-solid-svg-icons";
import { inputsApi, outputsApi } from "../Api";
import { getBull } from "../Api/bulls";
import { getRaceById } from "../Api/races";
import { getSexById } from "../Api/sexes";
import { parse } from "@fortawesome/fontawesome-svg-core";

const InputsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [input, setInput] = useState(null);
  const [bullDetails, setBullDetails] = useState(null);
  const [bullInputs, setBullInputs] = useState([]);
  const [raceData, setRaceData] = useState(null);
  const [sexData, setSexData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingBullInputs, setLoadingBullInputs] = useState(false);
  const [error, setError] = useState(null);

  // Formulario para agregar nueva salida
  const [outputForm, setOutputForm] = useState({
    quantity_output: "",
    output_date: new Date().toISOString().split("T")[0],
    remark: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showAddOutput, setShowAddOutput] = useState(false);

  // Cargar detalles del input y del toro asociado
  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        // Cargar detalles de la entrada
        const inputData = await inputsApi.getInputById(id);
        console.log("Datos de entrada obtenidos:", inputData);
        setInput(inputData);

        // Si tenemos el ID del toro, cargar sus detalles
        if (inputData && inputData.bull_id) {
          try {
            // Usamos getBull para obtener todos los detalles del toro
            const bull = await getBull(inputData.bull_id);
            console.log("Datos completos del toro:", bull);
            setBullDetails(bull);

            // Verificar si necesitamos cargar datos de raza
            if (bull.race_id && (!bull.race || !bull.race.name)) {
              try {
                const race = await getRaceById(bull.race_id);
                console.log("Datos de raza:", race);
                setRaceData(race);
              } catch (raceError) {
                console.error("Error al cargar datos de raza:", raceError);
              }
            }

            // Verificar si necesitamos cargar datos de sexo
            if (bull.sex_id && (!bull.sex || !bull.sex.name)) {
              try {
                const sex = await getSexById(bull.sex_id);
                console.log("Datos de sexo:", sex);
                setSexData(sex);
              } catch (sexError) {
                console.error("Error al cargar datos de sexo:", sexError);
              }
            }

            // Cargar historial de entradas del toro
            await loadBullOutput(id);
            // console.log("Entradas del toro cargadas:", bullInputs);
          } catch (bullError) {
            console.error("Error al cargar datos del toro:", bullError);
          }
        }
      } catch (err) {
        console.error("Error al cargar detalles:", err);
        setError(
          "No se pudieron cargar los detalles. Por favor, intente nuevamente."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [id]);

  // Cargar todas las entradas del toro
  const loadBullOutput = async (inputId) => {
    if (!inputId) return;

    setLoadingBullInputs(true);
    try {
      // Usamos el servicio específico para traer entradas por toro
      const bullInputsData = await outputsApi.getOutputsByInput(inputId);
      // console.log("Respuesta de getInputsByBull:", bullInputsData);

      // // Aseguramos el formato correcto sea cual sea la respuesta de la API
      // console.log("Datos de entradas del toro:", bullInputsData);

      setBullInputs(bullInputsData || []);
    } catch (error) {
      console.error("Error al cargar entradas del toro:", error);
      console.error(
        "Detalles del error:",
        error.response?.data || error.message
      );
    } finally {
      setLoadingBullInputs(false);
    }
  };

  // Manejar cambios en el formulario de salida
  const handleOutputChange = (e) => {
    const { name, value } = e.target;
    setOutputForm({ ...outputForm, [name]: value });
  };

  // Enviar formulario de nueva salida
  const handleSubmitOutput = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validar cantidad
      if (parseFloat(outputForm.quantity_output) <= 0) {
        throw new Error("La cantidad debe ser mayor a cero");
      }

      // Crear nueva salida
      const response = await outputsApi.createOutput(id, outputForm);
      console.log("Salida creada:", response);

      // Limpiar formulario
      setOutputForm({
        quantity_output: "",
        output_date: new Date().toISOString().split("T")[0],
        remark: "",
      });

      setShowAddOutput(false);

      // Recargar los datos del input para ver el cambio en el total
      const updatedInput = await inputsApi.getInputById(id);
      setInput(updatedInput);
    } catch (err) {
      console.error("Error al crear salida:", err);
      setError(
        err.message ||
          "No se pudo crear la salida. Por favor, intente nuevamente."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Cambiar estado del input
  const handleStatusChange = async (newStatus) => {
    if (window.confirm(`¿Estás seguro de cambiar el estado a ${newStatus}?`)) {
      setLoading(true);

      try {
        await inputsApi.updateInputStatus(id, newStatus);

        // Actualizar el input en el estado
        const updatedInput = await inputsApi.getInputById(id);
        setInput(updatedInput);
      } catch (err) {
        console.error("Error al cambiar estado:", err);
        setError(
          "No se pudo cambiar el estado. Por favor, intente nuevamente."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Navegar a la vista de detalles de otra entrada
  const viewInputDetails = (inputId) => {
    navigate(`/gestion/inputs/${inputId}`);
  };

  // Función para obtener el nombre de la raza
  const getRaceName = () => {
    if (bullDetails?.race?.name) return bullDetails.race.name;
    if (bullDetails?.race_name) return bullDetails.race_name;
    if (raceData?.name) return raceData.name;
    return "No disponible";
  };

  // Función para obtener el nombre del sexo
  const getSexName = () => {
    if (bullDetails?.sex?.name) return bullDetails.sex.name;
    if (bullDetails?.sex_name) return bullDetails.sex_name;
    if (sexData?.name) return sexData.name;
    return "No disponible";
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-4" role="alert">
        <h4 className="alert-heading">Error al cargar datos</h4>
        <p>{error}</p>
        <hr />
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/gestion/inputs")}
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  if (!input) {
    return (
      <div className="alert alert-warning m-4" role="alert">
        <h4 className="alert-heading">Entrada no encontrada</h4>
        <p>No se encontró la entrada con ID: {id}</p>
        <hr />
        <div className="d-flex justify-content-end">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/gestion/inputs")}
          >
            Volver a la lista
          </button>
        </div>
      </div>
    );
  }

  // Calcular valores de cantidades
  const quantityReceived = parseFloat(input.quantity_received || 0);
  const quantityUsed = parseFloat(input.quantity_taken || 0);
  const quantityAvailable = parseFloat(input.total);

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-info-circle me-2"></i>
          Detalles de Entrada - {input.id}
        </h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate("/inventory")}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Volver a la lista
        </button>
      </div>

      {/* Detalles básicos */}
      <div className="row">
        <div className="col-md-6">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">Información del Toro</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Nombre</h6>
                  <p className="mb-0 fs-5">
                    {bullDetails?.name || "No disponible"}
                  </p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">ID del Toro</h6>
                  <p className="mb-0 fs-5">#{bullDetails?.id || "N/A"}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Raza</h6>
                  <p className="mb-0">{getRaceName()}</p>
                </div>
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Registro</h6>
                  <p className="mb-0">
                    {bullDetails?.register || "No disponible"}
                  </p>
                </div>
              </div>

              <div className="row mb-3">
                {/* <div className="col-md-6">
                  <h6 className="text-muted mb-1">Estado</h6>
                  <p className="mb-0">
                    <span className={`badge bg-${bullDetails?.status === 'Active' ? 'success' : 'secondary'}`}>
                      {bullDetails?.status === 'Active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </p>
                </div> */}
                <div className="col-md-6">
                  <h6 className="text-muted mb-1">Sexo</h6>
                  <p className="mb-0">{getSexName()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          {/* Tarjeta para información de la entrada */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Detalles de la Entrada</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Fecha de Registro</h6>
                  <p className="mb-0">
                    {input.created_at
                      ? new Date(input.created_at).toLocaleDateString("es-CO", {
                          timeZone: "UTC",
                        })
                      : "No disponible"}
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Estado</h6>
                  <p className="mb-0">
                    <span
                      className={`badge bg-${getStatusColor(
                        input.status || input.status_id
                      )}`}
                    >
                      {input.status || input.status_id || "Pendiente"}
                    </span>
                  </p>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Lote</h6>
                  <p className="mb-0">{input.lote}</p>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Unidades Recibida</h6>
                  <p className="mb-0 fw-bold">{quantityReceived.toFixed(1)}</p>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Unidades Utilizada</h6>
                  <p className="mb-0 fw-bold">{quantityUsed.toFixed(1)}</p>
                </div>
                <div className="col-md-4">
                  <h6 className="text-muted mb-1">Unidades Disponibles</h6>
                  <p className="mb-0 fw-bold">
                    <span
                      className={
                        quantityAvailable <= 0 ? "text-danger" : "text-success"
                      }
                    >
                      {quantityAvailable.toFixed(1)}
                      {quantityAvailable <= 0 && (
                        <span className="badge bg-danger ms-2">Agotado</span>
                      )}
                    </span>
                  </p>
                </div>
              </div>

              {/* <div className="row mt-3">
                <div className="col-12">
                  <h6 className="text-muted mb-1">Observaciones</h6>
                  <p className="mb-0">{input.observations || 'Sin observaciones'}</p>
                </div>
              </div> */}
            </div>
          </div>
        </div>
        {/* <div className="col-md-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">Detalles Adicionales</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <h6 className="text-muted mb-1">Creado por</h6>
                <p className="mb-0">{input.created_by_name || 'Sistema'}</p>
              </div>
              
              <div className="mb-3">
                <h6 className="text-muted mb-1">Última actualización</h6>
                <p className="mb-0">
                  {input.updated_at ? new Date(input.updated_at).toLocaleDateString('es-CO', {
timeZone: 'UTC' });() : 'Sin actualizar'}
                </p>
              </div>
            </div>
          </div>
          

          <div className="card shadow-sm mb-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Acciones</h5>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button 
                  className="btn btn-success"
                  onClick={() => setShowAddOutput(!showAddOutput)}
                  disabled={quantityAvailable <= 0}
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Registrar Salida
                </button>
                
                <div className="dropdown">
                  <button 
                    className="btn btn-outline-primary dropdown-toggle w-100" 
                    type="button" 
                    data-bs-toggle="dropdown"
                  >
                    <i className="bi bi-arrow-repeat me-2"></i>
                    Cambiar Estado
                  </button>
                  <ul className="dropdown-menu w-100">
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleStatusChange('Pending')}
                      >
                        <span className="badge bg-warning me-2">Pendiente</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleStatusChange('Processing')}
                      >
                        <span className="badge bg-primary me-2">En Proceso</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleStatusChange('Completed')}
                      >
                        <span className="badge bg-success me-2">Completado</span>
                      </button>
                    </li>
                    <li>
                      <button 
                        className="dropdown-item" 
                        onClick={() => handleStatusChange('Cancelled')}
                      >
                        <span className="badge bg-danger me-2">Cancelado</span>
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Formulario para agregar salida */}
      {showAddOutput && (
        <div className="card shadow-sm mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Registrar Nueva Salida</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmitOutput}>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">
                    Cantidad (Unidades)*
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="quantity_output"
                    value={outputForm.quantity_output}
                    onChange={handleOutputChange}
                    required
                    step="0.1"
                    min="0.1"
                    max={quantityAvailable > 0 ? quantityAvailable : undefined}
                    placeholder={`Máximo: ${quantityAvailable.toFixed(
                      1
                    )} unidades`}
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Fecha*</label>
                  <input
                    type="date"
                    className="form-control"
                    name="output_date"
                    value={outputForm.output_date}
                    onChange={handleOutputChange}
                    required
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label fw-bold">Observaciones</label>
                  <textarea
                    className="form-control"
                    name="remark"
                    value={outputForm.remark}
                    onChange={handleOutputChange}
                    rows="1"
                  />
                </div>
              </div>
              <div className="d-flex justify-content-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={() => setShowAddOutput(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={submitting || quantityAvailable <= 0}
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Guardar Salida
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historial de Entradas del Toro */}
      <div className="card shadow-sm">
        <div className="card-header bg-info text-white">
          <h5 className="mb-0">Historial de salidas</h5>
        </div>
        <div className="card-body">
          {loadingBullInputs ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">
                Cargando historial de entradas...
              </p>
            </div>
          ) : bullInputs && bullInputs.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Cantidad Utilizada</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {bullInputs.map((item) => {
                    const received = parseFloat(item.quantity_received || 0);
                    const used = parseFloat(item.quantity_take || 0);
                    const available =
                      item.quantity_available !== undefined
                        ? parseFloat(item.quantity_available)
                        : received - used;

                    return (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                "es-CO",
                                {
                                  timeZone: "UTC",
                                }
                              )
                            : "N/A"}
                        </td>
                        <td>{item.quantity_output}</td>
                        <td>{item.remark || "Sin observaciones"}</td>
                        {/* <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => viewInputDetails(item.id)}
                            title="Ver detalles"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        </td> */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-3">
              <i className="bi bi-inbox" style={{ fontSize: "2rem" }}></i>
              <p className="text-muted mt-2">
                No hay otras entradas registradas para este toro
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Función auxiliar para obtener el color según el estado
const getStatusColor = (status) => {
  switch (status) {
    case "Pending":
      return "primary";
    case "Processing":
      return "warning";
    case "Completed":
      return "danger";
    case "Cancelled":
      return "danger";
    default:
      return "secondary";
  }
};

export default InputsDetails;
