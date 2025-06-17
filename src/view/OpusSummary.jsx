import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as reportApi from "../Api/productionEmbrionary";
import * as userApi from "../Api/users.js";

const OpusSummary = () => {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const loadSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {};

      // Agregar query de búsqueda si existe
      if (searchQuery.trim()) {
        filters.query = searchQuery.trim();
      }

      // Agregar fechas solo si ambas están presentes
      if (dateRange.startDate && dateRange.endDate) {
        filters.fecha_inicio = dateRange.startDate;
        filters.fecha_fin = dateRange.endDate;
      }

      const data = await reportApi.getAllProductions(filters);
      
      const transforData = await Promise.all(
        data.map(async (item) => {
          const fullName = await getUserName(item.cliente_id);
          return { full_name: fullName, ...item };
        })
      );
      console.log({ dataReport: data });

      setSummaryData(Array.isArray(transforData) ? transforData : []);
    } catch (error) {
      console.error("Error al cargar datos del resumen:", error);
      setError(
        "Error al cargar los datos: " +
          (error.response?.data?.detail || error.message)
      );
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadSummaryData();
  }, []);

  // Manejar búsqueda con debounce - solo fechas si ambas están presentes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSummaryData();
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    ...(dateRange.startDate && dateRange.endDate
      ? [dateRange.startDate, dateRange.endDate]
      : []),
  ]);

  const getUserName = async (id) => {
    try {
      const result = await userApi.getUserById(id);
      return result.full_name;
    } catch (e) {
      console.error({ error: e });
      return "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-CO", {
      timeZone: "UTC",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return timeString.substring(0, 5); // Mostrar solo HH:MM
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSummaryData();
  };

  const handleRowClick = (recordId) => {
    navigate(`/reportdetails/${recordId}`);
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">
        <i className="bi bi-clipboard2-data me-2"></i>
        Resumen de Producciones
      </h2>

      <div className="card mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit}>
            <div className="row">
              <div className="col-md-4">
                <label className="form-label">Buscar Cliente</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Documento, nombre o correo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="submit"
                    disabled={loading}
                  >
                    <i className="bi bi-search"></i>
                  </button>
                </div>
              </div>
              <div className="col-md-4">
                <label className="form-label">Fecha Inicio</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateRange.startDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      startDate: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Fecha Fin</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateRange.endDate}
                  onChange={(e) =>
                    setDateRange((prev) => ({
                      ...prev,
                      endDate: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">
              {error}
              <button
                className="btn btn-link btn-sm float-end"
                onClick={() => loadSummaryData()}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Resultados ({summaryData.length})</h5>
                <div>
                  {(dateRange.startDate || dateRange.endDate) &&
                    !(dateRange.startDate && dateRange.endDate) && (
                      <small className="text-warning me-3">
                        <i className="bi bi-exclamation-triangle"></i>{" "}
                        Selecciona ambas fechas para filtrar
                      </small>
                    )}
                  {(searchQuery ||
                    (dateRange.startDate && dateRange.endDate)) && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setSearchQuery("");
                        setDateRange({ startDate: "", endDate: "" });
                      }}
                    >
                      Limpiar filtros
                    </button>
                  )}
                </div>
              </div>

              {summaryData.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-inbox fs-1"></i>
                  <p className="mt-2">No se encontraron resultados</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha OPU</th>
                        <th>Lugar</th>
                        <th>Finca</th>
                        <th>Hora Inicio</th>
                        <th>Hora Final</th>
                        <th>Envase</th>
                        <th>Fecha Transferencia</th>
                        <th>Creado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summaryData.map((record) => (
                        <tr
                          key={record.id}
                          onClick={() => handleRowClick(record.id)}
                          style={{ cursor: "pointer" }}
                          className="table-row-hover"
                        >
                          <td>
                            <span className="badge bg-primary">
                              {record.id}
                            </span>
                          </td>
                          <td>{record.full_name}</td>
                          <td>{formatDate(record.fecha_opu)}</td>
                          <td>
                            <span className="badge bg-info">
                              {record.lugar}
                            </span>
                          </td>
                          <td>{record.finca || "-"}</td>
                          <td>{formatTime(record.hora_inicio)}</td>
                          <td>{formatTime(record.hora_final)}</td>
                          <td>{record.envase || "-"}</td>
                          <td>{formatDate(record.fecha_transferencia)}</td>
                          <td>{formatDate(record.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpusSummary;
