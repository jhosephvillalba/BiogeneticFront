import React, { useState, useEffect } from 'react';
import { usersApi } from '../api';
import * as opusApi from "../api/opus";

const OpusSummary = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientError, setClientError] = useState(null);
  
  // Estados para filtros
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  // Cargar clientes
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      setClientError(null);
      const response = await usersApi.filterUsers({ role_id: 3 }, 0, 100);
      const clientsList = Array.isArray(response) ? response : (response.items || []);
      setClients(clientsList);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setClientError("Error al cargar la lista de clientes: " + (error.response?.data?.detail || error.message));
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // Cargar datos del resumen
  const loadSummaryData = async () => {
    try {
      setLoading(true);
      setError(null);

      let data = [];
      if (selectedClient) {
        data = await opusApi.getOpusByClient(selectedClient);
      } else {
        // Si no hay cliente seleccionado, obtener todos los registros
        data = await opusApi.getOpusGroupedByDate();
      }

      // Filtrar por fecha si es necesario
      if (dateRange.startDate || dateRange.endDate) {
        data = data.filter(record => {
          const recordDate = new Date(record.fecha);
          const start = dateRange.startDate ? new Date(dateRange.startDate) : new Date(0);
          const end = dateRange.endDate ? new Date(dateRange.endDate) : new Date();
          return recordDate >= start && recordDate <= end;
        });
      }

      setSummaryData(data);
    } catch (error) {
      console.error("Error al cargar datos del resumen:", error);
      setError("Error al cargar los datos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummaryData();
  }, [selectedClient, dateRange.startDate, dateRange.endDate]);

  // Calcular totales
  const calculateTotals = () => {
    return summaryData.reduce((acc, record) => ({
      total_registros: (acc.total_registros || 0) + record.total_registros,
      total_oocitos: (acc.total_oocitos || 0) + record.total_oocitos,
      total_embriones: (acc.total_embriones || 0) + record.total_embriones,
      promedio_embriones: ((acc.total_embriones || 0) + record.total_embriones) / summaryData.length
    }), {});
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  return (
    <div className="container-fluid py-4">
      <h2 className="mb-4">
        <i className="bi bi-clipboard2-data me-2"></i>
        Resumen de Producción de Embriones
      </h2>

      {/* Filtros */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <label className="form-label">Cliente</label>
              {clientError ? (
                <div className="alert alert-danger py-2">
                  <small>{clientError}</small>
                  <button 
                    className="btn btn-link btn-sm float-end py-0"
                    onClick={() => loadClients()}
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <select 
                  className="form-select"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  disabled={loadingClients}
                >
                  <option value="">Todos los clientes</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha Inicio</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  startDate: e.target.value
                }))}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Fecha Fin</label>
              <input
                type="date"
                className="form-control"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({
                  ...prev,
                  endDate: e.target.value
                }))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de resumen */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total Registros</th>
                    <th>Total Oocitos</th>
                    <th>Total Embriones</th>
                    <th>% Éxito</th>
                    <th>Promedio Embriones</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((record, index) => (
                    <tr key={index}>
                      <td>{formatDate(record.fecha)}</td>
                      <td>{record.cliente_nombre}</td>
                      <td>{record.total_registros}</td>
                      <td>{record.total_oocitos}</td>
                      <td>{record.total_embriones}</td>
                      <td>{record.porcentaje_exito}</td>
                      <td>{record.promedio_embriones}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="table-light">
                  <tr>
                    <td colSpan="2"><strong>Totales</strong></td>
                    {Object.entries(calculateTotals()).map(([key, value], index) => (
                      <td key={index}>
                        <strong>
                          {key === 'promedio_embriones' ? value.toFixed(2) : value}
                        </strong>
                      </td>
                    ))}
                    <td></td> {/* Columna vacía para % Éxito */}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpusSummary; 