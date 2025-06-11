import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../Api';
import { getBullsByClient } from '../Api/bulls';
import * as opusApi from '../Api/opus';

const EmbryoProduction = () => {
  const navigate = useNavigate();

  // Estados para el manejo de clientes
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  // Estado separado para lugar y finca
  const [locationData, setLocationData] = useState({
    lugar: '',
    finca: ''
  });

  // Estados para toros del cliente
  const [clientBulls, setClientBulls] = useState([]);
  const [femaleBulls, setFemaleBulls] = useState([]);
  const [maleBulls, setMaleBulls] = useState([]);
  const [loadingBulls, setLoadingBulls] = useState(false);

  // Estados para la producción de embriones
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para el modal de nueva/edición producción
  const [showProductionModal, setShowProductionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newProductionData, setNewProductionData] = useState({
    fecha_opu: new Date().toISOString().split('T')[0],
    donante: '',
    raza: 'Gyr',
    toro: '',
    toro_id: '',
    g1: 0,
    g2: 0,
    g3: 0,
    otros: 0,
    observaciones: ''
  });



  // Cargar clientes
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      setError(null);

      const filters = {
        role_id: 3, // ID para clientes
        search: clientSearchTerm
      };

      const response = await usersApi.filterUsers(filters, 0, 100);
      const clientsList = Array.isArray(response) ? response : (response.items || []);
      setClients(clientsList);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setError("No se pudieron cargar los clientes. " + (error.response?.data?.detail || error.message));
    } finally {
      setLoadingClients(false);
    }
  };

  // Cargar toros del cliente seleccionado
  const loadClientBulls = async (clientId) => {
    try {
      setLoadingBulls(true);
      const response = await getBullsByClient(clientId);
      const bullsList = Array.isArray(response) ? response : (response.items || []);

      // Separar toros por sexo (asumiendo que sex_id 2 es hembra)
      const females = bullsList.filter(bull => bull.sex_id === 2);
      const males = bullsList.filter(bull => bull.sex_id === 1);

      setClientBulls(bullsList);
      setFemaleBulls(females);
      setMaleBulls(males);
    } catch (error) {
      console.error("Error al cargar toros del cliente:", error);
    } finally {
      setLoadingBulls(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearchTerm.trim() !== '') {
        loadClients();
      } else {
        setClients([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearchTerm]);

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setClientSearchTerm('');
    setClients([]);
    await loadClientBulls(client.id);

    // Resetear lugar y finca al cambiar de cliente
    setLocationData({
      lugar: '',
      finca: ''
    });

    setNewProductionData({
      fecha_opu: new Date().toISOString().split('T')[0],
      donante: '',
      raza: 'Gyr',
      toro: '',
      toro_id: '',
      g1: 0,
      g2: 0,
      g3: 0,
      otros: 0,
      observaciones: ''
    });
  };

  const handleEdit = async (production) => {
    try {
      // Obtener los detalles completos del registro
      const opusDetails = await opusApi.getOpus(production.id);

      // Actualizar el estado con los datos del registro
      setNewProductionData({
        id: opusDetails.id,
        fecha_opu: opusDetails.fecha,
        donante: opusDetails.donante_id.toString(),
        raza: opusDetails.donante?.race?.name || 'Gyr',
        toro_id: opusDetails.toro_id.toString(),
        toro: opusDetails.toro?.name || '',
        g1: opusDetails.gi || 0,
        g2: opusDetails.gii || 0,
        g3: opusDetails.giii || 0,
        otros: opusDetails.otros || 0,
        observaciones: opusDetails.observaciones || ''
      });

      // Actualizar locationData con los datos existentes
      setLocationData({
        lugar: production.lugar || '',
        finca: production.finca || ''
      });

      setIsEditing(true);
      setShowProductionModal(true);
    } catch (error) {
      console.error("Error al cargar detalles del registro:", error);
      alert("Error al cargar los detalles del registro: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (opusId) => {
    if (window.confirm('¿Está seguro de eliminar este registro?')) {
      try {
        await opusApi.deleteOpus(opusId);
        await loadOpusRecords(); // Recargar la lista después de eliminar
        alert('Registro eliminado correctamente');
      } catch (error) {
        console.error("Error al eliminar registro:", error);
        alert("Error al eliminar el registro: " + (error.response?.data?.detail || error.message));
      }
    }
  };

  // Función para cargar registros OPUS del cliente seleccionado
  const loadOpusRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedClient) {
        setProductions([]);
        return;
      }

      const response = await opusApi.getOpusByClient(selectedClient.id);
      const opusList = Array.isArray(response) ? response : [];

      // Transformar los datos para mostrarlos en la tabla
      const formattedOpusList = opusList.map(opus => ({
        id: opus.id,
        cliente: selectedClient.full_name,
        lugar: locationData.lugar,
        fecha_opu: opus.fecha,
        finca: locationData.finca,
        donante: opus.donante?.name || opus.donante_id,
        raza: opus.donante?.race?.name || 'No especificada',
        toro: opus.toro?.name || opus.toro_id,
        g1: opus.gi,
        g2: opus.gii,
        g3: opus.giii,
        viables: opus.viables,
        otros: opus.otros,
        total: opus.total_oocitos,
        cuv: opus.ctv,
        cultivados: opus.clivados,
        cultivados_percent: opus.porcentaje_cliv,
        prevision: opus.prevision,
        prevision_percent: opus.porcentaje_prevision,
        empaque: opus.empaque,
        empaque_percent: opus.porcentaje_empaque,
        vt_dt: opus.vt_dt,
        vtdt_percent: opus.porcentaje_vtdt,
        total_embriones: opus.total_embriones,
        total_embriones_percent: opus.porcentaje_total_embriones
      }));

      setProductions(formattedOpusList);
    } catch (error) {
      console.error("Error al cargar registros OPUS:", error);
      setError("No se pudieron cargar los registros OPUS. " + (error.response?.data?.detail || error.message));
      setProductions([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar registros OPUS cuando cambia el cliente seleccionado
  useEffect(() => {
    if (selectedClient) {
      loadOpusRecords();
    }
  }, [selectedClient]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient) {
      alert('Por favor, seleccione un cliente antes de continuar.');
      return;
    }

    try {
      setLoading(true);

      // Validaciones básicas
      const gi = parseInt(newProductionData.g1) || 0;
      const gii = parseInt(newProductionData.g2) || 0;
      const giii = parseInt(newProductionData.g3) || 0;
      const otros = parseInt(newProductionData.otros) || 0;

      if (gi < 0 || gii < 0 || giii < 0 || otros < 0) {
        alert('Los valores no pueden ser negativos');
        return;
      }

      // Calcular totales básicos
      const viables = gi + gii + giii;
      const total_oocitos = viables + otros;

      // Obtener valores del formulario o establecer cero si no existen
      const ctv = parseInt(newProductionData.ctv) || 0;
      const clivados = parseInt(newProductionData.clivados) || 0;
      const prevision = parseInt(newProductionData.prevision) || 0;
      const empaque = parseInt(newProductionData.empaque) || 0;
      const vt_dt = parseInt(newProductionData.vt_dt) || 0;

      // Calcular porcentajes según la fórmula correcta
      const calcularPorcentaje = (valor, total) => {
        return total > 0 ? `${Math.round((valor / total) * 100)}%` : "0%";
      };

      // Calcular total de embriones
      const total_embriones = vt_dt + empaque + prevision;

      // Preparar el objeto de datos completo
      const opusData = {
        cliente_id: selectedClient.id,
        donante_id: parseInt(newProductionData.donante),
        toro_id: parseInt(newProductionData.toro_id),
        fecha: newProductionData.fecha_opu,
        toro: newProductionData.toro,
        gi: gi,
        gii: gii,
        giii: giii,
        viables: viables,
        otros: otros,
        total_oocitos: total_oocitos,
        ctv: ctv,
        clivados: clivados,
        porcentaje_cliv: calcularPorcentaje(clivados, ctv),
        prevision: prevision,
        porcentaje_prevision: calcularPorcentaje(prevision, ctv),
        empaque: empaque,
        porcentaje_empaque: calcularPorcentaje(empaque, ctv),
        vt_dt: vt_dt,
        porcentaje_vtdt: calcularPorcentaje(vt_dt, ctv),
        total_embriones: total_embriones,
        porcentaje_total_embriones: calcularPorcentaje(total_embriones, ctv),
        lugar: locationData.lugar,
        finca: locationData.finca,
        observaciones: newProductionData.observaciones
      };

      if (isEditing && newProductionData.id) {
        await opusApi.updateOpus(newProductionData.id, opusData);
        alert('Registro actualizado correctamente');
      } else {
        await opusApi.createOpus(opusData);
        alert('Registro creado correctamente');
      }

      // Recargar registros
      await loadOpusRecords();
      setShowProductionModal(false);
      setIsEditing(false);

    } catch (error) {
      console.error("Error al procesar registro OPUS:", error);
      alert("Error al procesar el registro: " + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2>
            <i className="bi bi-clipboard2-pulse me-2"></i>
            Producción de Embriones Bovinos
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/opus-summary')}
          >
            <i className="bi bi-bar-chart-line me-2"></i>
            Ver Resumen
          </button>
        </div>

        {/* Selección de cliente */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <label className="form-label">Buscar Cliente</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nombre, documento o email..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                  />
                  {loadingClients && (
                    <span className="input-group-text">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </span>
                  )}
                </div>
                {clients.length > 0 && (
                  <div className="list-group mt-2 shadow-sm">
                    {clients.map(client => (
                      <button
                        key={client.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => handleSelectClient(client)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{client.full_name}</strong>
                            <br />
                            <small className="text-muted">
                              Doc: {client.number_document} | {client.email}
                            </small>
                          </div>
                          <i className="bi bi-chevron-right"></i>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedClient && (
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h5 className="card-title mb-1">Cliente Seleccionado</h5>
                          <h6 className="mb-2">{selectedClient.full_name}</h6>
                          <p className="mb-0 small">
                            <strong>Documento:</strong> {selectedClient.number_document}<br />
                            <strong>Email:</strong> {selectedClient.email}
                          </p>
                        </div>
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => {
                            setSelectedClient(null);
                            setClientBulls([]);
                          }}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedClient && (
          <>
            {/* Información del OPU */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label">Lugar</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locationData.lugar}
                      onChange={(e) => setLocationData(prev => ({
                        ...prev,
                        lugar: e.target.value
                      }))}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Finca</label>
                    <input
                      type="text"
                      className="form-control"
                      value={locationData.finca}
                      onChange={(e) => setLocationData(prev => ({
                        ...prev,
                        finca: e.target.value
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botón para nueva producción */}
            <div className="d-flex justify-content-end mb-3">
              <button
                className="btn btn-success"
                onClick={() => {
                  if (!locationData.lugar || !locationData.finca) {
                    alert('Por favor, complete el lugar y la finca antes de agregar un nuevo registro.');
                    return;
                  }
                  setIsEditing(false);
                  setNewProductionData({
                    fecha_opu: new Date().toISOString().split('T')[0],
                    donante: '',
                    raza: 'Gyr',
                    toro: '',
                    toro_id: '',
                    g1: 0,
                    g2: 0,
                    g3: 0,
                    otros: 0,
                    observaciones: ''
                  });
                  setShowProductionModal(true);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nuevo Registro
              </button>
            </div>

            {/* Tabla de producciones */}
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>N°</th>
                        <th>Cliente</th>
                        <th>Lugar</th>
                        <th>Fecha OPU</th>
                        <th>Finca</th>
                        <th>Donante</th>
                        <th>Raza</th>
                        <th>Toro</th>
                        <th colSpan="3" className="text-center">Oocitos Viables</th>
                        <th>Viables</th>
                        <th>Otros</th>
                        <th>Total</th>
                        <th>CUV</th>
                        <th>Cultivados</th>
                        <th>% Cult.</th>
                        <th>Previsión</th>
                        <th>% Prev.</th>
                        <th>Acciones</th>
                      </tr>
                      <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th>GI</th>
                        <th>GII</th>
                        <th>GIII</th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {productions.map((production, index) => (
                        <tr key={production.id}>
                          <td>{index + 1}</td>
                          <td>{production.cliente}</td>
                          <td>{production.lugar}</td>
                          <td>{formatDate(production.fecha_opu)}</td>
                          <td>{production.finca}</td>
                          <td>{production.donante}</td>
                          <td>{production.raza}</td>
                          <td>{production.toro}</td>
                          <td>{production.g1}</td>
                          <td>{production.g2}</td>
                          <td>{production.g3}</td>
                          <td>{production.viables}</td>
                          <td>{production.otros}</td>
                          <td>{production.total}</td>
                          <td>{production.cuv}</td>
                          <td>{production.cultivados}</td>
                          <td>{production.cultivados_percent}</td>
                          <td>{production.prevision}</td>
                          <td>{production.prevision_percent}</td>
                          <td>
                            <div className="btn-group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                title="Editar"
                                onClick={() => handleEdit(production)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger ms-1"
                                title="Eliminar"
                                onClick={() => handleDelete(production.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-light">
                        <td colSpan="8" className="text-end"><strong>Totales:</strong></td>
                        <td>{productions.reduce((sum, p) => sum + p.g1, 0)}</td>
                        <td>{productions.reduce((sum, p) => sum + p.g2, 0)}</td>
                        <td>{productions.reduce((sum, p) => sum + p.g3, 0)}</td>
                        <td>{productions.reduce((sum, p) => sum + p.viables, 0)}</td>
                        <td>{productions.reduce((sum, p) => sum + p.otros, 0)}</td>
                        <td>{productions.reduce((sum, p) => sum + p.total, 0)}</td>
                        <td>{productions.reduce((sum, p) => sum + p.cuv, 0)}</td>
                        <td>{productions.reduce((sum, p) => sum + p.cultivados, 0)}</td>
                        <td>-</td>
                        <td>{productions.reduce((sum, p) => sum + p.prevision, 0)}</td>
                        <td>-</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal para nueva/edición producción */}
      {showProductionModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isEditing ? 'Editar Registro' : 'Nuevo Registro OPU'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowProductionModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Fecha OPU</label>
                      <input
                        type="date"
                        className="form-control"
                        value={newProductionData.fecha_opu}
                        onChange={(e) => setNewProductionData(prev => ({
                          ...prev,
                          fecha_opu: e.target.value
                        }))}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Donante</label>
                      <select
                        className="form-select"
                        value={newProductionData.donante}
                        onChange={(e) => setNewProductionData(prev => ({
                          ...prev,
                          donante: e.target.value
                        }))}
                        required
                      >
                        <option value="">Seleccionar donante</option>
                        {femaleBulls.map(bull => (
                          <option key={bull.id} value={bull.id}>
                            {bull.name} ({bull.register})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Toro</label>
                      <select
                        className="form-select"
                        value={newProductionData.toro_id}
                        onChange={(e) => setNewProductionData(prev => ({
                          ...prev,
                          toro_id: e.target.value
                        }))}
                        required
                      >
                        <option value="">Seleccionar toro</option>
                        {maleBulls.map(bull => (
                          <option key={bull.id} value={bull.id}>
                            {bull.name} ({bull.register})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Raza</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newProductionData.raza}
                        disabled
                      />
                    </div>
                  </div>

                  {/* Sección de conteo de oocitos */}
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Conteo de Oocitos</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4">
                          <label className="form-label">GI</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.g1}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setNewProductionData(prev => ({
                                ...prev,
                                g1: value,
                                viables: value + prev.g2 + prev.g3,
                                total: value + prev.g2 + prev.g3 + prev.otros
                              }));
                            }}
                            min="0"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">GII</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.g2}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setNewProductionData(prev => ({
                                ...prev,
                                g2: value,
                                viables: prev.g1 + value + prev.g3,
                                total: prev.g1 + value + prev.g3 + prev.otros
                              }));
                            }}
                            min="0"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">GIII</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.g3}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setNewProductionData(prev => ({
                                ...prev,
                                g3: value,
                                viables: prev.g1 + prev.g2 + value,
                                total: prev.g1 + prev.g2 + value + prev.otros
                              }));
                            }}
                            min="0"
                            required
                          />
                        </div>
                      </div>

                      <div className="row mt-3">
                        <div className="col-md-4">
                          <label className="form-label">Viables (G1+G2+G3)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.g1 + newProductionData.g2 + newProductionData.g3}
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Otros</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.otros}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              setNewProductionData(prev => ({
                                ...prev,
                                otros: value,
                                total: prev.g1 + prev.g2 + prev.g3 + value
                              }));
                            }}
                            min="0"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Total (Viables+Otros)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.g1 + newProductionData.g2 + newProductionData.g3 + newProductionData.otros}
                            readOnly
                            disabled
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección de resultados */}
                  <div className="card mb-3">
                    <div className="card-header bg-light">
                      <h6 className="mb-0">Resultados</h6>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-6">
                          <label className="form-label">CIV</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.ctv}
                            onChange={(e) => setNewProductionData(prev => ({
                              ...prev,
                              ctv: parseInt(e.target.value) || 0
                            }))}
                            min="0"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Clivados</label>
                          <input
                            type="number"
                            className="form-control"
                            value={newProductionData.clivados}
                            onChange={(e) => setNewProductionData(prev => ({
                              ...prev,
                              clivados: parseInt(e.target.value) || 0
                            }))}
                            min="0"
                            required
                          />
                          <small className="text-muted">
                            % Clivados: {newProductionData.ctv > 0
                              ? `${Math.round((newProductionData.clivados / newProductionData.ctv) * 100)}%`
                              : '0%'}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Observaciones</label>
                    <textarea
                      className="form-control"
                      value={newProductionData.observaciones}
                      onChange={(e) => setNewProductionData(prev => ({
                        ...prev,
                        observaciones: e.target.value
                      }))}
                      rows="3"
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProductionModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {isEditing ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmbryoProduction; 