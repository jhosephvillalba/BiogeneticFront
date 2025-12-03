import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransferencia } from '../Api/transferencias.js';
import { getUserById } from '../Api/users.js';

const TransferReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transferencia, setTransferencia] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTransferencia = async () => {
      if (!id) {
        setError('ID de transferencia no válido');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getTransferencia(id);
        setTransferencia(response);
        
        // Cargar datos del cliente si existe el cliente_id
        if (response.cliente_id) {
          try {
            const clienteData = await getUserById(response.cliente_id);
            setCliente(clienteData);
          } catch (clienteError) {
            console.error('Error cargando datos del cliente:', clienteError);
            // No mostrar error crítico si no se pueden cargar los datos del cliente
          }
        }
      } catch (err) {
        console.error('Error cargando transferencia:', err);
        setError('Error al cargar los detalles de la transferencia.');
      } finally {
        setLoading(false);
      }
    };

    loadTransferencia();
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };

  const handlePrint = () => {
    window.print();
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateString) => {
    if (!dateString) return 'No especificada';
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-muted">Cargando informe de transferencia...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-4">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <hr />
          <button className="btn btn-outline-danger" onClick={handleBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (!transferencia) {
    return (
      <div className="container-fluid mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">No encontrado</h4>
          <p>No se encontró la transferencia solicitada.</p>
          <hr />
          <button className="btn btn-outline-warning" onClick={handleBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      {/* Encabezado del informe */}
      <div className="d-flex justify-content-between align-items-center mb-4 d-print-none">
        <h1 className="h2 mb-0">Informe Detallado de Transferencia</h1>
        <div className="btn-group">
          <button className="btn btn-outline-secondary" onClick={handleBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
          <button className="btn btn-outline-primary" onClick={handlePrint}>
            <i className="bi bi-printer me-2"></i>
            Imprimir
          </button>
        </div>
      </div>

      {/* Información principal de la transferencia */}
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h3 className="card-title mb-0">
            <i className="bi bi-file-earmark-text me-2"></i>
            Transferencia #{transferencia.id}
          </h3>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h5 className="text-primary mb-3">Información General</h5>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: '40%' }}>ID de Transferencia:</td>
                    <td>#{transferencia.id}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Fecha de Transferencia:</td>
                    <td>{formatDate(transferencia.fecha_transferencia)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Fecha de Registro:</td>
                    <td>{formatDate(transferencia.fecha)}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Veterinario Responsable:</td>
                    <td>{transferencia.veterinario_responsable || 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Estado del Reporte:</td>
                    <td>
                      <span className={`badge ${transferencia.initial_report ? 'bg-warning' : 'bg-success'}`}>
                        {transferencia.initial_report ? 'Inicial' : 'Finalizado'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h5 className="text-primary mb-3">Información del Cliente</h5>
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td className="fw-bold" style={{ width: '40%' }}>Cliente:</td>
                    <td>{cliente?.full_name || transferencia.cliente_nombre || 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Email:</td>
                    <td>{cliente?.email || transferencia.cliente_email || 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Documento:</td>
                    <td>{cliente?.number_document || transferencia.cliente_documento || 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Lugar:</td>
                    <td>{transferencia.lugar || 'No especificado'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Finca:</td>
                    <td>{transferencia.finca || 'No especificada'}</td>
                  </tr>
                  <tr>
                    <td className="fw-bold">Producción ID:</td>
                    <td>#{transferencia.produccion_embrionaria_id || 'No especificado'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Observaciones */}
      {transferencia.observacion && (
        <div className="card mb-4">
          <div className="card-header bg-info text-white">
            <h4 className="card-title mb-0">
              <i className="bi bi-chat-text me-2"></i>
              Observaciones
            </h4>
          </div>
          <div className="card-body">
            <p className="mb-0">{transferencia.observacion}</p>
          </div>
        </div>
      )}

      {/* Reportes de transferencia */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
          <h4 className="card-title mb-0">
            <i className="bi bi-table me-2"></i>
            Registros de Transferencia
            <span className="badge bg-light text-dark ms-2">
              {transferencia.reportes?.length || 0} registros
            </span>
          </h4>
        </div>
        <div className="card-body">
          {transferencia.reportes && transferencia.reportes.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th className="text-center" style={{ width: '5%' }}>#</th>
                    <th style={{ width: '15%' }}>Donadora</th>
                    <th style={{ width: '12%' }}>Raza Donadora</th>
                    <th style={{ width: '15%' }}>Toro</th>
                    <th style={{ width: '12%' }}>Raza del Toro</th>
                    <th style={{ width: '10%' }}>Estado</th>
                    <th style={{ width: '15%' }}>Receptora</th>
                    <th className="text-center" style={{ width: '8%' }}>Ovario</th>
                    <th className="text-center" style={{ width: '6%' }}>DX</th>
                    <th className="text-center" style={{ width: '6%' }}>DXX</th>
                    <th className="text-center" style={{ width: '6%' }}>DXXX</th>
                  </tr>
                </thead>
                <tbody>
                  {transferencia.reportes.map((reporte, index) => (
                    <tr key={reporte.id || `reporte-${index}`}>
                      <td className="text-center fw-bold">{index + 1}</td>
                      <td>{reporte.donadora || '-'}</td>
                      <td>{reporte.raza_donadora || '-'}</td>
                      <td>{reporte.toro || '-'}</td>
                      <td>{reporte.toro_raza || '-'}</td>
                      <td>
                        <span className={`badge ${reporte.estado ? 'bg-primary' : 'bg-secondary'}`}>
                          {reporte.estado || 'Sin estado'}
                        </span>
                      </td>
                      <td>{reporte.receptora || '-'}</td>
                      <td className="text-center">
                        <span className={`badge ${reporte.ovario === 'D' ? 'bg-warning' : 'bg-info'}`}>
                          {reporte.ovario || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${reporte.dx === 'P+' ? 'bg-success' : 'bg-danger'}`}>
                          {reporte.dx || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${reporte.dxx === 'P+' ? 'bg-success' : 'bg-danger'}`}>
                          {reporte.dxx || '-'}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`badge ${reporte.dxxx === 'P+' ? 'bg-success' : 'bg-danger'}`}>
                          {reporte.dxxx || '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="alert alert-warning mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No hay registros de transferencia disponibles para este informe.
            </div>
          )}
        </div>
      </div>

      {/* Resumen estadístico */}
      {transferencia.reportes && transferencia.reportes.length > 0 && (
        <div className="card mb-4">
          <div className="card-header bg-secondary text-white">
            <h4 className="card-title mb-0">
              <i className="bi bi-bar-chart me-2"></i>
              Resumen Estadístico
            </h4>
          </div>
          <div className="card-body">
            <div className="row text-center">
              <div className="col-md-3">
                <div className="border rounded p-3 bg-light">
                  <h5 className="text-primary mb-1">{transferencia.reportes.length}</h5>
                  <small className="text-muted">Total de Registros</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 bg-light">
                  <h5 className="text-success mb-1">
                    {transferencia.reportes.filter(r => r.dx === 'P+').length}
                  </h5>
                  <small className="text-muted">DX Positivos</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 bg-light">
                  <h5 className="text-warning mb-1">
                    {transferencia.reportes.filter(r => r.ovario === 'D').length}
                  </h5>
                  <small className="text-muted">Ovario Diurno</small>
                </div>
              </div>
              <div className="col-md-3">
                <div className="border rounded p-3 bg-light">
                  <h5 className="text-info mb-1">
                    {transferencia.reportes.filter(r => r.estado && r.estado.trim()).length}
                  </h5>
                  <small className="text-muted">Con Estado Definido</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Información adicional para impresión */}
      <div className="d-none d-print-block">
        <hr />
        <div className="text-center text-muted">
          <small>
            Informe generado el {formatDateTime(new Date().toISOString())} por Sistema BioGenetic
          </small>
        </div>
      </div>
    </div>
  );
};

export default TransferReportDetail; 