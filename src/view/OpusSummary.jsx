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

  // Estado para paginación del servidor
  const [pagination, setPagination] = useState({
    currentPage: 1,
    itemsPerPage: 20, // Cambiar a 20 registros por página
    totalItems: 0,
  });

  const handleDate = (date) => {
    // Convertimos a objeto Date
    console.log("-->>>>>>>>>>>>", date);
    const dateObj = new Date(date);
    // Sumamos 5 días
    dateObj.setDate(dateObj.getDate() + 5);
    // Formateamos nuevamente en formato YYYY-MM-DD
    return dateObj.toISOString().split("T")[0];
  };

  const loadSummaryData = async (page = 1) => {
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
        // Enviar solo la parte de la fecha en formato UTC (YYYY-MM-DD)
        const startDateUTC = new Date(dateRange.startDate).toISOString().slice(0, 10);
        const endDateUTC = new Date(dateRange.endDate).toISOString().slice(0, 10);
        filters.fecha_inicio = startDateUTC;
        filters.fecha_fin = endDateUTC;
      }

      // Calcular skip para la paginación
      const skip = (page - 1) * pagination.itemsPerPage;
      const limit = pagination.itemsPerPage;

      const response = await reportApi.getAllProductions(filters, skip, limit);
      
      // Manejar diferentes formatos de respuesta del servidor
      let data = [];
      let totalItems = 0;

      if (response && typeof response === 'object') {
        // Si la respuesta tiene estructura { items: [], total: number }
        if (response.items && Array.isArray(response.items)) {
          data = response.items;
          totalItems = response.total || response.items.length;
        }
        // Si la respuesta tiene estructura { results: [], count: number }
        else if (response.results && Array.isArray(response.results)) {
          data = response.results;
          totalItems = response.count || response.results.length;
        }
        // Si la respuesta es directamente un array
        else if (Array.isArray(response)) {
          data = response;
          totalItems = response.length;
        }
        // Si la respuesta tiene estructura { data: [], total: number }
        else if (response.data && Array.isArray(response.data)) {
          data = response.data;
          totalItems = response.total || response.data.length;
        }
        else {
          console.warn("Formato de respuesta inesperado:", response);
          data = [];
          totalItems = 0;
        }
      } else if (Array.isArray(response)) {
        data = response;
        totalItems = response.length;
      } else {
        console.warn("Formato de respuesta inesperado:", response);
        data = [];
        totalItems = 0;
      }

      // Obtener nombres de usuarios para cada registro
      const transforData = await Promise.all(
        data.map(async (item) => {
          const fullName = await getUserName(item.cliente_id);
          return { full_name: fullName, ...item };
        })
      );

      console.log({ dataReport: transforData, totalItems });

      setSummaryData(transforData);
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalItems: totalItems // Usar el total real del servidor
      }));
    } catch (error) {
      console.error("Error al cargar datos del resumen:", error);
      setError(
        "Error al cargar los datos: " +
          (error.response?.data?.detail || error.message)
      );
      setSummaryData([]);
      setPagination(prev => ({
        ...prev,
        totalItems: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadSummaryData(1);
  }, []);

  // Manejar búsqueda con debounce - solo fechas si ambas están presentes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSummaryData(1); // Siempre volver a la primera página al filtrar
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timeoutId);
  }, [
    searchQuery,
    ...(dateRange.startDate && dateRange.endDate
      ? [dateRange.startDate, dateRange.endDate]
      : []),
  ]);

  // Manejar cambio de página
  const handlePageChange = (page) => {
    loadSummaryData(page);
  };

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
    loadSummaryData(1);
  };

  const handleRowClick = (recordId) => {
    navigate(`/reportdetails/${recordId}`);
  };

  // Calcular información de paginación
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  const startItem = ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1;
  const endItem = Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems);

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
                onClick={() => loadSummaryData(1)}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Resultados ({pagination.totalItems})</h5>
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
                <>
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
                            <td>{formatDate(handleDate(record.fecha_opu))}</td>
                            <td>{formatDate(record.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Información de paginación y controles */}
                  {pagination.totalItems > 0 && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      {/* Información de registros */}
                      <div className="text-muted small">
                        Mostrando {startItem} a {endItem} de {pagination.totalItems} registros
                      </div>

                      {/* Paginación */}
                      {totalPages > 1 && (
                        <nav aria-label="Paginación de producciones">
                          <ul className="pagination pagination-sm mb-0">
                            {/* Botón Anterior */}
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
                                disabled={pagination.currentPage === 1}
                              >
                                <i className="bi bi-chevron-left"></i>
                              </button>
                            </li>

                            {/* Números de página */}
                            {(() => {
                              const currentPage = pagination.currentPage;
                              const pages = [];

                              // Mostrar máximo 5 páginas alrededor de la página actual
                              let startPage = Math.max(1, currentPage - 2);
                              let endPage = Math.min(totalPages, currentPage + 2);

                              // Ajustar si estamos cerca del inicio
                              if (currentPage <= 3) {
                                endPage = Math.min(5, totalPages);
                              }

                              // Ajustar si estamos cerca del final
                              if (currentPage >= totalPages - 2) {
                                startPage = Math.max(1, totalPages - 4);
                              }

                              // Agregar primera página si no está incluida
                              if (startPage > 1) {
                                pages.push(
                                  <li key={1} className="page-item">
                                    <button
                                      className="page-link"
                                      onClick={() => handlePageChange(1)}
                                    >
                                      1
                                    </button>
                                  </li>
                                );
                                if (startPage > 2) {
                                  pages.push(
                                    <li key="ellipsis1" className="page-item disabled">
                                      <span className="page-link">...</span>
                                    </li>
                                  );
                                }
                              }

                              // Agregar páginas del rango
                              for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                  <li
                                    key={i}
                                    className={`page-item ${
                                      currentPage === i ? "active" : ""
                                    }`}
                                  >
                                    <button
                                      className="page-link"
                                      onClick={() => handlePageChange(i)}
                                    >
                                      {i}
                                    </button>
                                  </li>
                                );
                              }

                              // Agregar última página si no está incluida
                              if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                  pages.push(
                                    <li key="ellipsis2" className="page-item disabled">
                                      <span className="page-link">...</span>
                                    </li>
                                  );
                                }
                                pages.push(
                                  <li key={totalPages} className="page-item">
                                    <button
                                      className="page-link"
                                      onClick={() => handlePageChange(totalPages)}
                                    >
                                      {totalPages}
                                    </button>
                                  </li>
                                );
                              }

                              return pages;
                            })()}

                            {/* Botón Siguiente */}
                            <li
                              className={`page-item ${
                                pagination.currentPage === totalPages
                                  ? "disabled"
                                  : ""
                              }`}
                            >
                              <button
                                className="page-link"
                                onClick={() =>
                                  handlePageChange(pagination.currentPage + 1)
                                }
                                disabled={pagination.currentPage === totalPages}
                              >
                                <i className="bi bi-chevron-right"></i>
                              </button>
                            </li>
                          </ul>
                        </nav>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpusSummary;
