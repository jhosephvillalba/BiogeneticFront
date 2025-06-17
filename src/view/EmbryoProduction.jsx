import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usersApi } from "../Api";
import { getBullsByClient } from "../Api/bulls";
import * as opusApi from "../Api/opus";
import * as productionApi from "../Api/productionEmbrionary";
import { getRaces } from "../Api/races";

const EmbryoProduction = () => {
  const navigate = useNavigate();
  // Estados para el manejo de clientes
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [production, setProduction] = useState(null);

  // Estado para producción embrionaria
  const [embryoProductionData, setEmbryoProductionData] = useState({
    cliente_id: 0,
    fecha_opu: new Date().toISOString().split("T")[0],
    lugar: "",
    finca: "",
    hora_inicio: "",
    hora_final: "",
    output_id: 0,
    envase: "",
    fecha_transferencia: new Date().toISOString().split("T")[0],
  });

  // Estados para la tabla editable
  const [opusRows, setOpusRows] = useState([]);
  const [editingRow, setEditingRow] = useState(null);

  // Estados para toros del cliente
  const [clientBulls, setClientBulls] = useState([]);
  const [femaleBulls, setFemaleBulls] = useState([]);
  const [maleBulls, setMaleBulls] = useState([]);
  const [loadingBulls, setLoadingBulls] = useState(false);
  const [bullRaces, setBullRaces] = useState([]);

  // Estados para el modal de semen
  const [showSemenModal, setShowSemenModal] = useState(false);
  const [semenEntries, setSemenEntries] = useState([]);

  // Estados para manejo de errores y loading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Implementar función loadClients
  const loadClients = async (searchTerm = "") => {
    setLoadingClients(true);
    setError(null);
    try {
      // Cargar todos los usuarios/clientes
      const allUsers = await usersApi.searchUsers({
        role_id: 3,
        q: searchTerm,
      });

      setClients(allUsers);
    } catch (err) {
      console.error("Error al cargar clientes:", err);
      setError("Error al cargar la lista de clientes");
    } finally {
      setLoadingClients(false);
    }
  };

  // ✅ Implementar función loadClientBulls
  const loadClientBulls = async (clientId) => {
    setLoadingBulls(true);
    try {
      const bulls = await getBullsByClient(clientId);
      setClientBulls(bulls);

      // Separar por género si la API lo proporciona
      const females = bulls.filter(
        (bull) => bull.gender === "female" || bull.sex === "F"
      );
      const males = bulls.filter(
        (bull) => bull.gender === "male" || bull.sex === "M"
      );

      setFemaleBulls(females);
      setMaleBulls(males);
    } catch (err) {
      console.error("Error al cargar toros del cliente:", err);
      setError("Error al cargar los toros del cliente");
    } finally {
      setLoadingBulls(false);
    }
  };

  // ✅ Cargar razas al montar el componente
  useEffect(() => {
    const loadRaces = async () => {
      try {
        const races = await getRaces();
        setBullRaces(races);
      } catch (err) {
        console.error("Error al cargar razas:", err);
      }
    };

    loadRaces();
    loadClients(); // Cargar clientes iniciales
  }, []);

  // Buscar clientes cuando cambie el término de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearchTerm.length >= 2) {
        loadClients(clientSearchTerm);
      } else if (clientSearchTerm === "") {
        loadClients();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearchTerm]);

  // Manejar selección de cliente
  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setEmbryoProductionData({
      ...embryoProductionData,
      cliente_id: client.id,
    });
    await loadClientBulls(client.id);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Guardando Produccíon embrionaria...");
    console.log({ embryoProductionData: embryoProductionData });
    productionApi
      .createProduction(embryoProductionData)
      .then((result) => {
        console.log({ result: result });
        setProduction(result);
        alert("Produccón embrionaria guardada exitosamente.");
      })
      .catch((error) => {
        alert("No fue posible guardar los datos");
        console.error(error);
      });
  };

  // Agregar nueva fila a la tabla
  const handleAddNewRow = () => {
    setOpusRows([
      ...opusRows,
      {
        donante_code: "",
        race: "",
        toro:"",
        toro_id: 0,
        toro_name: "", // ✅ Agregar campo para nombre del toro
        donante_id:0,
        gi: 0,
        gii: 0,
        giii: 0,
        otros: 0,
        viables: 0,
        total_oocitos: 0,
        ctv: 0,
        clivados: 0,
        prevision: 0,
        empaque: 0,
        vt_dt: 0,
        total_embriones:"",
        porcentaje_total_embriones:"",
        produccion_embrionaria_id:production.id
      },
    ]);
  };

  // Manejar cambios en las filas
  const handleRowChange = (index, field, value) => {
    const updatedRows = [...opusRows];
    updatedRows[index][field] = value;

    // ✅ Si se cambia el toro, también guardar su nombre
    if (field === "toro_id") {
      const selectedBull = clientBulls.find(
        (bull) => bull.id === parseInt(value)
      );
      updatedRows[index].toro_name = selectedBull
        ? selectedBull.name || selectedBull.full_name || selectedBull.code
        : "";
    }

    // Calcular campos dependientes
    if (["gi", "gii", "giii", "otros"].includes(field)) {
      const gi = parseInt(updatedRows[index].gi) || 0;
      const gii = parseInt(updatedRows[index].gii) || 0;
      const giii = parseInt(updatedRows[index].giii) || 0;
      const otros = parseInt(updatedRows[index].otros) || 0;

      updatedRows[index].viables = gi + gii + giii;
      updatedRows[index].total_oocitos = gi + gii + giii + otros;
    }

    setOpusRows(updatedRows);
  };

  // Manejar cambio específico para oocitos
  const handleOocyteChange = (index, field, value) => {
    const numValue = parseInt(value) || 0;
    handleRowChange(index, field, numValue);
  };

  // Eliminar fila
  const handleRemoveRow = (index) => {
    const updatedRows = opusRows.filter((_, i) => i !== index);
    setOpusRows(updatedRows);
  };

  // Abrir modal de semen
  const handleOpenSemenModal = () => {
    const mockSemenEntries = maleBulls.map((bull) => ({
      toro: bull.name || bull.full_name,
      disponible: 10,
      usada: 2,
      recibida: 8,
      utilizar: 0,
    }));
    setSemenEntries(mockSemenEntries);
    setShowSemenModal(true);
  };

  // Manejar cambio en unidades de semen
  const handleSemenChange = (index, value) => {
    const updatedEntries = [...semenEntries];
    updatedEntries[index].utilizar = parseFloat(value) || 0;
    setSemenEntries(updatedEntries);
  };

  // Guardar unidades de semen
  const handleSaveSemenUnits = () => {
    console.log("Unidades utilizadas:", semenEntries);
    setShowSemenModal(false);
  };

  // Guardar toda la producción embrionaria
  const handleSaveProduction = async () => {
    try {
      setLoading(true);

      // // Primero guardar los datos principales
      // const productionResponse = await opusApi.createEmbryoProduction(
      //   embryoProductionData
      // );

      // Luego guardar cada registro OPU
      const opusPromises = opusRows.map((row) =>
        opusApi.createOpus({
          ...row,
          cliente_id: selectedClient.id,
          lugar: embryoProductionData.lugar,
          finca: embryoProductionData.finca,
          fecha: embryoProductionData.fecha_opu,
          donante_id:row.toro_id,
          porcentaje_cliv:
            `${row.ctv > 0 ? Math.round((row.clivados / row.ctv) * 100) : 0}%`,
          porcentaje_prevision:
           `${ row.ctv > 0 ? Math.round((row.prevision / row.ctv) * 100) : 0}%`,
          porcentaje_empaque:
            `${row.ctv > 0 ? Math.round((row.empaque / row.ctv) * 100) : 0}%`,
          porcentaje_vtdt:
            `${row.ctv > 0 ? Math.round((row.vt_dt / row.ctv) * 100) : 0}%`,

          total_embriones: Math.round(row.empaque + row.vt_dt + row.clivados),

          porcentaje_total_embriones: `${row.ctv > 0 ? Math.round((row.empaque + row.vt_dt + row.clivados)/row.ctv) : 0}%`,
        })
      );

      await Promise.all(opusPromises);
      alert("Producción embrionaria guardada correctamente.");

      setOpusRows([]); 
    } catch (error) {
      console.error("Error al guardar producción embrionaria:", error);
      alert(
        "Error al guardar: " + (error.response?.data?.detail || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">
        <i className="bi bi-egg me-2"></i>
        Producción Embrionaria
      </h2>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* ✅ Sección de búsqueda de cliente */}
      {!selectedClient && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Seleccionar Cliente</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label className="form-label">Buscar Cliente</label>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar por nombre o email..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
              />
            </div>

            {loadingClients ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              </div>
            ) : (
              <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Email</th>
                      <th>Teléfono</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <tr key={client.id}>
                          <td>{client.full_name}</td>
                          <td>{client.email}</td>
                          <td>{client.phone}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleSelectClient(client)}
                            >
                              <i className="bi bi-check me-1"></i>
                              Seleccionar
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center text-muted">
                          {clientSearchTerm
                            ? "No se encontraron clientes"
                            : "Escriba al menos 2 caracteres para buscar"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedClient && (
        <>
          {/* Cliente seleccionado */}
          <div className="alert alert-info mb-4">
            <h6 className="mb-1">
              <i className="bi bi-person-check me-2"></i>
              Cliente Seleccionado: {selectedClient.full_name}
            </h6>
            <small className="text-muted">{selectedClient.email}</small>
            {/* ✅ Mostrar información de toros cargados */}
            {clientBulls.length > 0 && (
              <div className="mt-2">
                <small className="text-success">
                  <i className="bi bi-check-circle me-1"></i>
                  {clientBulls.length} toro(s) disponible(s)
                </small>
              </div>
            )}
          </div>

          {/* Formulario de producción embrionaria */}
          <form className="card mb-4" onSubmit={handleSubmit}>
            <div className="card-header">
              <h5>Crear Producción Embrionaria</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <label className="form-label">Fecha OPU</label>
                  <input
                    type="date"
                    className="form-control"
                    value={embryoProductionData.fecha_opu}
                    onChange={(e) =>
                      setEmbryoProductionData({
                        ...embryoProductionData,
                        fecha_opu: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Lugar</label>
                  <input
                    type="text"
                    className="form-control"
                    value={embryoProductionData.lugar}
                    onChange={(e) =>
                      setEmbryoProductionData({
                        ...embryoProductionData,
                        lugar: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Finca</label>
                  <input
                    type="text"
                    className="form-control"
                    value={embryoProductionData.finca}
                    onChange={(e) =>
                      setEmbryoProductionData({
                        ...embryoProductionData,
                        finca: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-4">
                  <label className="form-label">Hora Inicio</label>
                  <input
                    type="time"
                    className="form-control"
                    value={embryoProductionData.hora_inicio}
                    onChange={(e) =>
                      setEmbryoProductionData({
                        ...embryoProductionData,
                        hora_inicio: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Hora Final</label>
                  <input
                    type="time"
                    className="form-control"
                    value={embryoProductionData.hora_final}
                    onChange={(e) =>
                      setEmbryoProductionData({
                        ...embryoProductionData,
                        hora_final: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Envase</label>
                  <input
                    type="text"
                    className="form-control"
                    value={embryoProductionData.envase}
                    onChange={(e) =>
                      setEmbryoProductionData({
                        ...embryoProductionData,
                        envase: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <button type="submit" className={`${"btn mt-3"} ${production === null ? 'btn-warning' : 'btn-danger'}`} disabled={!(production === null)}>
                <span className="text-white fw-bolder">Crear Producción</span>
              </button>
            </div>
          </form>

          {production === null ? (
            <div className="card mb-4">
              {" "}
              <span>Registe los datos de la producción</span>
            </div>
          ) : (
            <>
              {/* Tabla editable de registros OPU */}
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5>Registros OPU</h5>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleAddNewRow}
                  >
                    <i className="bi bi-plus"></i> Agregar Fila
                  </button>
                </div>
                <div className="card-body">
                  {loadingBulls && (
                    <div className="alert alert-info">
                      <i className="bi bi-hourglass-split me-2"></i>
                      Cargando toros del cliente...
                    </div>
                  )}
                  <div style={{ maxHeight: "350px", overflowY: "auto" }}>
                    <table className="table table-bordered">
                      <thead className="sticky-top bg-light">
                        <tr>
                          <th>Donante</th>
                          <th>Raza</th>
                          <th>Toro</th> {/* ✅ Nueva columna para toros */}
                          <th>GI</th>
                          <th>GII</th>
                          <th>GIII</th>
                          <th>Otros</th>
                          <th>Viables</th>
                          <th>Total</th>
                          <th>CIV</th>
                          <th>Clivados</th>
                          <th>% Cliv</th>

                          <th>Empacados</th>
                          <th>% Emp</th>

                          <th>Previsión</th>
                          <th>% Prev</th>
                          <th>VT/DT</th>
                          <th>% VT/DT</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {opusRows.length === 0 ? (
                          <tr>
                            <td
                              colSpan="17"
                              className="text-center text-muted py-4"
                            >
                              {" "}
                              {/* ✅ Actualizar colspan */}
                              No hay registros OPU. Haga clic en "Agregar Fila"
                              para comenzar.
                            </td>
                          </tr>
                        ) : (
                          opusRows.map((row, index) => (
                            <tr key={index}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={row.donante_code}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "donante_code",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.race}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "race",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">Seleccionar</option>
                                  {bullRaces.map((race) => (
                                    <option
                                      key={race.id}
                                      value={race.code || race.id}
                                    >
                                      {race.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              {/* ✅ Nueva columna para seleccionar toro */}
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={row.toro_id}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "toro_id",
                                      e.target.value
                                    )
                                  }
                                  disabled={clientBulls.length === 0}
                                >
                                  <option value="">Seleccionar Toro</option>
                                  {clientBulls.map((bull) => (
                                    <option key={bull.id} value={bull.id}>
                                      {bull.name ||
                                        bull.full_name ||
                                        bull.code ||
                                        `Toro ${bull.id}`}
                                      {bull.sex && ` (${bull.sex})`}
                                    </option>
                                  ))}
                                </select>
                                {clientBulls.length === 0 && (
                                  <small className="text-muted">
                                    Sin toros
                                  </small>
                                )}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.gi}
                                  onChange={(e) =>
                                    handleOocyteChange(
                                      index,
                                      "gi",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.gii}
                                  onChange={(e) =>
                                    handleOocyteChange(
                                      index,
                                      "gii",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.giii}
                                  onChange={(e) =>
                                    handleOocyteChange(
                                      index,
                                      "giii",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.otros}
                                  onChange={(e) =>
                                    handleOocyteChange(
                                      index,
                                      "otros",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>{row.viables}</td>
                              <td>{row.total_oocitos}</td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.ctv}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "ctv",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.clivados}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "clivados",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                              <td>
                                {row.ctv > 0
                                  ? `${Math.round(
                                      (row.clivados / row.ctv) * 100
                                    )}%`
                                  : "0%"}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.empaque}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "empaque",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                              <td>
                                {row.ctv > 0
                                  ? `${Math.round(
                                      (row.empaque / row.ctv) * 100
                                    )}%`
                                  : "0%"}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.prevision}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "prevision",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                              <td>
                                {row.ctv > 0
                                  ? `${Math.round(
                                      (row.prevision / row.ctv) * 100
                                    )}%`
                                  : "0%"}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={row.vt_dt}
                                  onChange={(e) =>
                                    handleRowChange(
                                      index,
                                      "vt_dt",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                />
                              </td>
                              <td>
                                {row.ctv > 0
                                  ? `${Math.round(
                                      (row.vt_dt / row.ctv) * 100
                                    )}%`
                                  : "0%"}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveRow(index)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Botones de acción */}
          <div className="d-flex justify-content-between mb-4">
            <button
              className="btn btn-secondary"
              onClick={() => setSelectedClient(null)}
            >
              <i className="bi bi-arrow-left"></i> Volver
            </button>
            <div>
              <button
                className="btn btn-info me-2"
                onClick={handleOpenSemenModal}
                disabled={maleBulls.length === 0}
              >
                <i className="bi bi-droplet"></i> Establecer Unidades Utilizadas
              </button>
              <button
                className="btn btn-success"
                onClick={handleSaveProduction}
                disabled={loading || opusRows.length === 0}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save"></i> Guardar Producción
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal para unidades de semen */}
      {showSemenModal && (
        <div
          className="modal"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Establecer Unidades Utilizadas</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSemenModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Toro</th>
                      <th>Disponible</th>
                      <th>Usada</th>
                      <th>Recibida</th>
                      <th>Utilizar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semenEntries.map((entry, index) => (
                      <tr key={index}>
                        <td>{entry.toro}</td>
                        <td>{entry.disponible}</td>
                        <td>{entry.usada}</td>
                        <td>{entry.recibida}</td>
                        <td>
                          <input
                            type="number"
                            step="0.1"
                            className="form-control"
                            value={entry.utilizar}
                            onChange={(e) =>
                              handleSemenChange(index, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowSemenModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveSemenUnits}
                >
                  Guardar Unidades
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbryoProduction;
