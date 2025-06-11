import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as opusApi from '../Api/opus';

const Reports = () => {
  const navigate = useNavigate();
  const [filterDate, setFilterDate] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [opuList, setOpuList] = useState([]);

  // Cargar datos agrupados por fecha
  const loadOpusData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await opusApi.getOpusGroupedByDate();
      
      const formattedData = response.map(opus => ({
        id: opus.id,
        fecha: opus.fecha,
        cliente: opus.cliente_nombre,
        total_registros: opus.total_registros,
        total_oocitos: opus.total_oocitos,
        total_embriones: opus.total_embriones,
        porcentaje_exito: opus.porcentaje_exito,
        promedio_embriones: opus.promedio_embriones
      }));

      setOpuList(formattedData);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setError(error.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpusData();
  }, []);

  // Obtener años únicos para el filtro
  const years = [...new Set(opuList.map(opu => new Date(opu.fecha).getFullYear()))];
  
  // Obtener meses únicos para el filtro
  const months = [...new Set(opuList.map(opu => new Date(opu.fecha).getMonth()))];

  // Filtrar la lista de OPUs
  const filteredOpus = opuList.filter(opu => {
    const opuDate = new Date(opu.fecha);
    
    if (filterYear && opuDate.getFullYear() !== parseInt(filterYear)) return false;
    if (filterMonth && opuDate.getMonth() !== parseInt(filterMonth)) return false;
    if (filterDate && opu.fecha !== filterDate) return false;
    
    return true;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleViewDetails = (opus) => {
    // Extraer solo la parte de la fecha (YYYY-MM-DD) sin la hora
    const datePart = opus.fecha.split('T')[0];
    // Navegar a la ruta de detalle con la fecha como parámetro
    navigate(`/reportdetails/${datePart}`);
  };

  return (
    <div className="container-fluid">
      <h2 className="mb-4">
        <i className="bi bi-file-text me-2"></i>
        Informes de Producción
      </h2>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Fecha Específica</label>
              <input
                type="date"
                className="form-control"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setFilterMonth('');
                  setFilterYear('');
                }}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Mes</label>
              <select
                className="form-select"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  setFilterDate('');
                }}
              >
                <option value="">Todos los meses</option>
                {months.map((month) => (
                  <option key={month} value={month}>
                    {new Date(2024, month).toLocaleString('es-ES', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Año</label>
              <select
                className="form-select"
                value={filterYear}
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setFilterDate('');
                }}
              >
                <option value="">Todos los años</option>
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-secondary w-100"
                onClick={() => {
                  setFilterDate('');
                  setFilterMonth('');
                  setFilterYear('');
                }}
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de OPUs */}
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
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
                <button 
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => loadOpusData()}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Reintentar
                </button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total Registros</th>
                    <th>Total Oocitos</th>
                    <th>Total Embriones</th>
                    <th>% Éxito</th>
                    <th>Promedio Embriones</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOpus.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">No hay registros disponibles</td>
                    </tr>
                  ) : (
                    filteredOpus.map((opus, index) => (
                      <tr key={index}>
                        <td>{formatDate(opus.fecha)}</td>
                        <td>{opus.cliente}</td>
                        <td>{opus.total_registros}</td>
                        <td>{opus.total_oocitos}</td>
                        <td>{opus.total_embriones}</td>
                        <td>{opus.porcentaje_exito}</td>
                        <td>{opus.promedio_embriones}</td>
                        <td>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleViewDetails(opus)}
                          >
                            <i className="bi bi-eye me-1"></i>
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;