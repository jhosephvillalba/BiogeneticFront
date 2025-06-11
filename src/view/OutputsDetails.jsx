import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { outputsApi } from '../Api';

const OutputsDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [output, setOutput] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOutputDetails = async () => {
      setLoading(true);
      try {
        const data = await outputsApi.getOutputById(id);
        setOutput(data);
      } catch (err) {
        console.error("Error al cargar los detalles de la salida:", err);
        setError("No se pudieron cargar los detalles. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    };

    fetchOutputDetails();
  }, [id]);

  const handleBack = () => {
    navigate('/gestion/outputs');
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>Volver a la lista
        </button>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="container-fluid p-4">
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          No se encontró la información de esta salida.
        </div>
        <button className="btn btn-primary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Detalles de Salida #{output.id}</h2>
        <button className="btn btn-primary" onClick={handleBack}>
          <i className="bi bi-arrow-left me-2"></i>Volver a la lista
        </button>
      </div>

      <div className="row">
        {/* Información principal */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Información Principal
              </h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">ID de Salida</label>
                  <p className="form-control-plaintext">{output.id}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Fecha</label>
                  <p className="form-control-plaintext">
                    {new Date(output.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Nombre del Toro</label>
                  <p className="form-control-plaintext">{output.bull_name || 'No especificado'}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Registro</label>
                  <p className="form-control-plaintext">{output.register_number || 'No especificado'}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Raza</label>
                  <p className="form-control-plaintext">{output.race_name || 'No especificado'}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Cantidad</label>
                  <p className="form-control-plaintext">{output.quantity || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Cliente */}
        <div className="col-md-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-person-fill me-2"></i>
                Información del Cliente
              </h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Nombre del Cliente</label>
                  <p className="form-control-plaintext">{output.client_name || 'No especificado'}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Identificación</label>
                  <p className="form-control-plaintext">{output.client_id || 'No especificado'}</p>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Teléfono</label>
                  <p className="form-control-plaintext">{output.client_phone || 'No especificado'}</p>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Email</label>
                  <p className="form-control-plaintext">{output.client_email || 'No especificado'}</p>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <label className="form-label fw-bold">Dirección</label>
                  <p className="form-control-plaintext">{output.client_address || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalles de la Salida */}
      <div className="row">
        <div className="col-12 mb-4">
          <div className="card shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-card-checklist me-2"></i>
                Detalles Adicionales
              </h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-bold">Lote</label>
                  <p className="form-control-plaintext">{output.lot_number || 'No especificado'}</p>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Tipo de Material</label>
                  <p className="form-control-plaintext">{output.material_type || 'No especificado'}</p>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">Estado</label>
                  <p className="form-control-plaintext">
                    <span className={`badge bg-${output.status === 'Completed' ? 'success' : 'warning'}`}>
                      {output.status === 'Completed' ? 'Completado' : 'Pendiente'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="row">
                <div className="col-12">
                  <label className="form-label fw-bold">Observaciones</label>
                  <p className="form-control-plaintext">{output.observations || 'Sin observaciones'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputsDetails; 