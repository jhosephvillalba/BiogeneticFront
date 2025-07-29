import React, { useState, useEffect } from 'react';
import { searchUsers } from '../Api/users.js';
import { getAllProductions } from '../Api/productionEmbrionary.js';
import { getOpusByProduction } from '../Api/opus.js';
import { 
  createTransferencia, 
  getTransferenciasByProduccion, 
  createReportTransfer,
  updateTransferencia
} from '../Api/transferencias.js';

const TransferReport = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [productions, setProductions] = useState([]);
  const [selectedProduction, setSelectedProduction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [opusRecords, setOpusRecords] = useState([]);
  const [transferRows, setTransferRows] = useState([]);
  const [loadingOpus, setLoadingOpus] = useState(false);
  const [currentTransferId, setCurrentTransferId] = useState(null);
  const [isReportSaved, setIsReportSaved] = useState(false);

  // Estados para los campos editables de cada fila
  const [rowsData, setRowsData] = useState({});

  // Opciones para los selects
  const horarioOptions = ['D', 'R'];
  const dxOptions = ['P+', 'V'];

  // Estado para el objeto transfers
  const [transfers, setTransfers] = useState({
    fecha_transferencia: new Date().toISOString().split('T')[0],
    veterinario_responsable: '',
    fecha: new Date().toISOString().split('T')[0],
    lugar: '',
    finca: '',
    observacion: '',
    produccion_embrionaria_id: 0,
    cliente_id: 0,
    initial_report: true,
    reportes: []
  });

  // Buscar clientes cuando el término de búsqueda cambia
  useEffect(() => {
    const searchClients = async () => {
      if (searchTerm.trim().length < 3) {
        setClients([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await searchUsers({ 
          q: searchTerm, 
          role_id: 3 // Solo clientes (rol_id = 3)
        });
        
        setClients(response.data || response); // Dependiendo de cómo venga la respuesta
      } catch (err) {
        console.error('Error buscando clientes:', err);
        setError('Error al buscar clientes. Por favor intente nuevamente.');
        setClients([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchClients, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Cargar producciones cuando se selecciona un cliente
  useEffect(() => {
    const loadProductions = async () => {
      if (!selectedClient) {
        setProductions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Usar getAllProductions con el número de documento del cliente como filtro
        const response = await getAllProductions({
          query: selectedClient.number_document // Filtrar por número de documento del cliente
        }, 0, 100); // Obtener hasta 100 producciones

        // Procesar la respuesta según su formato
        let productionsList = [];
        if (Array.isArray(response)) {
          productionsList = response;
        } else if (response.items && Array.isArray(response.items)) {
          productionsList = response.items;
        } else if (response.results && Array.isArray(response.results)) {
          productionsList = response.results;
        }

        // Filtrar solo las producciones del cliente seleccionado
        const clientProductions = productionsList.filter(prod => 
          prod.cliente_id === selectedClient.id
        );

        // Ordenar por fecha de más reciente a más antigua
        clientProductions.sort((a, b) => 
          new Date(b.fecha_opu || b.created_at) - new Date(a.fecha_opu || a.created_at)
        );

        setProductions(clientProductions);

        if (clientProductions.length === 0) {
          setError('No se encontraron producciones para este cliente.');
        }
      } catch (err) {
        console.error('Error cargando producciones:', err);
        setError('Error al cargar producciones del cliente.');
        setProductions([]);
      } finally {
        setLoading(false);
      }
    };

    loadProductions();
  }, [selectedClient]);

  // Cargar datos cuando se selecciona una producción
  const handleProductionSelect = async (production) => {
    // Limpiar estados antes de cargar la nueva producción
    setSelectedProduction(production);
    setOpusRecords([]);
    setTransferRows([]);
    setRowsData({});
    setCurrentTransferId(null);
    setTransfers({
      fecha_transferencia: new Date().toISOString().split('T')[0],
      veterinario_responsable: '',
      fecha: new Date().toISOString().split('T')[0],
      lugar: '',
      finca: '',
      observacion: '',
      produccion_embrionaria_id: 0,
      cliente_id: 0,
      initial_report: true,
      reportes: []
    });
    setError(null);

    if (!production) {
      return;
    }

    setLoadingOpus(true);
    try {
      // Primero verificar si existe una transferencia
      const existingTransfers = await getTransferenciasByProduccion(production.id);
      
      if (existingTransfers && existingTransfers.length > 0) {
        // Si existe una transferencia, usar la primera
        const transfer = existingTransfers[0];
        setCurrentTransferId(transfer.id);

        // Actualizar el objeto transfers con los datos existentes
        setTransfers({
          fecha_transferencia: transfer.fecha_transferencia || new Date().toISOString().split('T')[0],
          veterinario_responsable: transfer.veterinario_responsable || '',
          fecha: transfer.fecha || new Date().toISOString().split('T')[0],
          lugar: transfer.lugar || production.lugar || '',
          finca: transfer.finca || production.finca || '',
          observacion: transfer.observacion || '',
          produccion_embrionaria_id: production.id,
          cliente_id: selectedClient.id,
          initial_report: transfer.initial_report || false,
          reportes: transfer.reportes || []
        });

        // Si initial_report es false, usar solo los datos guardados
        if (transfer.initial_report === false && transfer.reportes && transfer.reportes.length > 0) {
          // Generar filas de transferencia basadas en los reportes guardados
          const savedRows = transfer.reportes.map((reporte, index) => ({
            id: `reporte-${index}`,
            rowNumber: index + 1,
            donadora: reporte.donadora || 'No especificado',
            raza: reporte.raza_donadora || 'No especificada',
            toro: reporte.toro || 'No especificado',
            razaToro: reporte.toro_raza || 'No especificada',
            opusId: null // No es un OPUS, es un reporte guardado
          }));

          setTransferRows(savedRows);
          
          // Inicializar los datos editables con los valores guardados
          const savedRowsData = {};
          savedRows.forEach((row, index) => {
            const reporte = transfer.reportes[index];
            savedRowsData[row.id] = {
              estado: reporte.estado || '',
              receptora: reporte.receptora || '',
              horario: reporte.horario || 'D',
              dx: reporte.dx || 'P+',
              dxx: reporte.dxx || 'P+',
              dxxx: reporte.dxxx || 'P+'
            };
          });
          setRowsData(savedRowsData);
        } else {
          // Si initial_report es true, cargar datos de OPUS
          const opusData = await getOpusByProduction(production.id);
          setOpusRecords(opusData);

          // Generar filas de transferencia basadas en los embriones empacados
          const rows = [];
          let rowCounter = 1;

          opusData.forEach(opus => {
            // Crear tantas filas como embriones empacados haya
            const empacados = parseInt(opus.empaque) || 0;
            for (let i = 0; i < empacados; i++) {
              rows.push({
                id: `${opus.id}-${i}`,
                rowNumber: rowCounter++,
                donadora: opus.donante_code || 'No especificado',
                raza: opus.race || 'No especificada',
                toro: opus.toro_nombre|| 'No especificado',
                razaToro: opus.toro_race || 'No especificada',
                opusId: opus.id
              });
            }
          });

          setTransferRows(rows);
          
          // Inicializar los datos editables para cada fila
          const initialRowsData = {};
          rows.forEach(row => {
            initialRowsData[row.id] = {
              estado: '',
              receptora: '',
              horario: 'D',
              dx: 'P+',
              dxx: 'P+',
              dxxx: 'P+'
            };
          });
          setRowsData(initialRowsData);
        }
      } else {
        // Si no existe transferencia, crear una vacía y cargar datos de OPUS
        const opusData = await getOpusByProduction(production.id);
        setOpusRecords(opusData);

        // Generar filas de transferencia basadas en los embriones empacados
        const rows = [];
        let rowCounter = 1;

        opusData.forEach(opus => {
          // Crear tantas filas como embriones empacados haya
          const empacados = parseInt(opus.empaque) || 0;
          for (let i = 0; i < empacados; i++) {
            rows.push({
              id: `${opus.id}-${i}`,
              rowNumber: rowCounter++,
              donadora: opus.donante_code || 'No especificado',
              raza: opus.race || 'No especificada',
              toro: opus.toro_nombre|| 'No especificado',
              razaToro: opus.toro_race || 'No especificada',
              opusId: opus.id
            });
          }
        });

        setTransferRows(rows);
        
        // Inicializar los datos editables para cada fila
        const initialRowsData = {};
        rows.forEach(row => {
          initialRowsData[row.id] = {
            estado: '',
            receptora: '',
            horario: 'D',
            dx: 'P+',
            dxx: 'P+',
            dxxx: 'P+'
          };
        });
        setRowsData(initialRowsData);

        // Crear transferencia vacía
        const emptyTransferData = {
          fecha_transferencia: new Date().toISOString().split('T')[0],
          veterinario_responsable: '',
          fecha: new Date().toISOString().split('T')[0],
          lugar: production.lugar || '',
          finca: production.finca || '',
          observacion: '',
          produccion_embrionaria_id: production.id,
          cliente_id: selectedClient.id,
          initial_report: true,
          reportes: []
        };

        try {
          const newTransfer = await createTransferencia(emptyTransferData);
          setCurrentTransferId(newTransfer.id);
          setTransfers(emptyTransferData);
        } catch (error) {
          console.error('Error al crear transferencia vacía:', error);
          setError('Error al crear transferencia inicial');
        }
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar detalles de la producción');
    } finally {
      setLoadingOpus(false);
    }
  };

  // Función para crear una transferencia vacía
  const createEmptyTransfer = async (production) => {
    try {
      const emptyTransferData = {
        fecha_transferencia: new Date().toISOString().split('T')[0],
        veterinario_responsable: '',
        fecha: new Date().toISOString().split('T')[0],
        lugar: production.lugar || '',
        finca: production.finca || '',
        observacion: '',
        produccion_embrionaria_id: production.id,
        cliente_id: selectedClient.id,
        initial_report: true,
        reportes: []
      };

      const newTransfer = await createTransferencia(emptyTransferData);
      setCurrentTransferId(newTransfer.id);
      
      // Actualizar el objeto transfers
      setTransfers(emptyTransferData);
      
      // Cargar datos de OPUS
      await loadOpusData(production.id);
    } catch (error) {
      console.error('Error al crear transferencia vacía:', error);
      setError('Error al crear transferencia');
    }
  };

  // Función para cargar datos de OPUS
  const loadOpusData = async (productionId) => {
    try {
      const opusData = await getOpusByProduction(productionId);
      setOpusRecords(opusData);

      // Generar filas de transferencia basadas en los embriones empacados
      const rows = [];
      let rowCounter = 1;

      opusData.forEach(opus => {
        // Crear tantas filas como embriones empacados haya
        const empacados = parseInt(opus.empaque) || 0;
        for (let i = 0; i < empacados; i++) {
          rows.push({
            id: `${opus.id}-${i}`,
            rowNumber: rowCounter++,
            donadora: opus.donante_code || 'No especificado',
            raza: opus.race || 'No especificada',
            toro: opus.toro_nombre|| 'No especificado',
            razaToro: opus.toro_race || 'No especificada',
            opusId: opus.id
          });
        }
      });

      setTransferRows(rows);
      
      // Inicializar los datos editables para cada fila
      const initialRowsData = {};
      rows.forEach(row => {
        initialRowsData[row.id] = {
          estado: '',
          receptora: '',
          horario: 'D',
          dx: 'P+',
          dxx: 'P+',
          dxxx: 'P+'
        };
      });
      setRowsData(initialRowsData);
    } catch (error) {
      console.error('Error al cargar datos de OPUS:', error);
      setError('Error al cargar datos de OPUS');
    }
  };

  // Función para cargar datos guardados
  const loadSavedData = async (transfer) => {
    try {
      // Generar filas de transferencia basadas en los reportes guardados
      const rows = transfer.reportes.map((reporte, index) => ({
        id: `reporte-${index}`,
        rowNumber: index + 1,
        donadora: reporte.donadora || 'No especificado',
        raza: reporte.raza_donadora || 'No especificada',
        toro: reporte.toro || 'No especificado',
        razaToro: reporte.toro_raza || 'No especificada',
        opusId: null // No es un OPUS, es un reporte guardado
      }));

      setTransferRows(rows);
      
      // Inicializar los datos editables con los valores guardados
      const initialRowsData = {};
      rows.forEach((row, index) => {
        const reporte = transfer.reportes[index];
        initialRowsData[row.id] = {
          estado: reporte.estado || '',
          receptora: reporte.receptora || '',
          horario: reporte.horario || 'D',
          dx: reporte.dx || 'P+',
          dxx: reporte.dxx || 'P+',
          dxxx: reporte.dxxx || 'P+'
        };
      });
      setRowsData(initialRowsData);
    } catch (error) {
      console.error('Error al cargar datos guardados:', error);
      setError('Error al cargar datos guardados');
    }
  };

  // Manejar cambios en los campos editables
  const handleRowDataChange = (rowId, field, value) => {
    // Actualizar rowsData
    const newRowsData = {
      ...rowsData,
      [rowId]: {
        ...rowsData[rowId],
        [field]: value
      }
    };
    
    setRowsData(newRowsData);

    // Actualizar inmediatamente los reportes en transfers
    const updatedReportes = transferRows.map(row => {
      const rowData = newRowsData[row.id] || {};
      return {
        donadora: row.donadora,
        raza_donadora: row.raza,
        toro: row.toro,
        toro_raza: row.razaToro,
        estado: rowData.estado || '',
        receptora: rowData.receptora || '',
        horario: rowData.horario || 'D',
        dx: rowData.dx || 'P+',
        dxx: rowData.dxx || 'P+',
        dxxx: rowData.dxxx || 'P+'
      };
    });

    setTransfers(prev => ({
      ...prev,
      reportes: updatedReportes
    }));
  };

  // Función para guardar los cambios de la tabla
  const handleSaveTableChanges = async () => {
    try {
      setLoading(true);
      
      // Preparar datos actualizados antes de enviar
      const transferenciaData = {
        ...transfers,
        reportes: transferRows.map(row => {
          const rowData = rowsData[row.id] || {};
          return {
            donadora: row.donadora,
            raza_donadora: row.raza,
            toro: row.toro,
            toro_raza: row.razaToro,
            estado: rowData.estado || '',
            receptora: rowData.receptora || '',
            horario: rowData.horario || 'D',
            dx: rowData.dx || 'P+',
            dxx: rowData.dxx || 'P+',
            dxxx: rowData.dxxx || 'P+'
          };
        })
      };
      
      // Actualizar la transferencia existente
      await updateTransferencia(currentTransferId, transferenciaData);
      
      // Actualizar el estado local
      setTransfers(transferenciaData);
      
      alert('Cambios de la tabla guardados exitosamente');
      
    } catch (error) {
      console.error('Error al guardar cambios de la tabla:', error);
      setError('Error al guardar los cambios de la tabla');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar cambios en los campos del formulario
  const handleFormChange = (field, value) => {
    setTransfers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para generar el informe
  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      
      // Actualizar reportes antes de enviar
      // updateTransfersReportes(); // This function is no longer needed here

      // Preparar datos de la transferencia
      const transferenciaData = {
        fecha_transferencia: transfers.fecha_transferencia,
        veterinario_responsable: transfers.veterinario_responsable,
        fecha: transfers.fecha,
        lugar: transfers.lugar,
        finca: transfers.finca,
        observacion: transfers.observacion,
        produccion_embrionaria_id: selectedProduction.id,
        cliente_id: selectedClient.id,
        initial_report: false, // Siempre false al guardar
        reportes: transferRows.map(row => {
          const rowData = rowsData[row.id] || {};
          return {
            donadora: row.donadora,
            raza_donadora: row.raza,
            toro: row.toro,
            toro_raza: row.razaToro,
            estado: rowData.estado || '',
            receptora: rowData.receptora || '',
            horario: rowData.horario || 'D',
            dx: rowData.dx || 'P+',
            dxx: rowData.dxx || 'P+',
            dxxx: rowData.dxxx || 'P+'
          };
        })
      };

      let response;
      if (currentTransferId) {
        // Si existe una transferencia, actualizarla (sin crear reportes nuevos)
        response = await updateTransferencia(currentTransferId, transferenciaData);
      } else {
        // Si no existe, crear una nueva
        response = await createTransferencia(transferenciaData);
        setCurrentTransferId(response.id);
      }

      // Actualizar el estado local
      setTransfers(transferenciaData);
      setIsReportSaved(true);

      alert('Informe de transferencia guardado exitosamente');
      
      // Recargar los datos
      await handleProductionSelect(selectedProduction);
      
    } catch (error) {
      console.error('Error al generar informe:', error);
      setError('Error al generar el informe de transferencia');
    } finally {
      setLoading(false);
    }
  };

  // Función para volver al inicio
  const handleBack = () => {
    setSelectedClient(null);
    setSelectedProduction(null);
    setSearchTerm('');
    setClients([]);
    setProductions([]);
    setOpusRecords([]);
    setTransferRows([]);
    setCurrentTransferId(null);
    setTransfers({
      fecha_transferencia: new Date().toISOString().split('T')[0],
      veterinario_responsable: '',
      fecha: new Date().toISOString().split('T')[0],
      lugar: '',
      finca: '',
      observacion: '',
      produccion_embrionaria_id: 0,
      cliente_id: 0,
      initial_report: true,
      reportes: []
    });
    setRowsData({});
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setSearchTerm(`${client.full_name} (${client.email})`);
    setClients([]); // Limpiar la lista de sugerencias
    setSelectedProduction(null); // Limpiar la producción seleccionada
    setCurrentTransferId(null);
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">Informe de Transferencia</h1>
        {selectedClient && (
          <button 
            className="btn btn-outline-secondary"
            onClick={handleBack}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver
          </button>
        )}
      </div>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      
      <div className="row">
        {/* Panel de selección de cliente */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title">Seleccionar Cliente</h2>
              
              <div className="position-relative">
                <div className="input-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar cliente por nombre, email o documento"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSelectedClient(null);
                      setSelectedProduction(null);
                    }}
                  />
                  {loading && (
                    <span className="input-group-text">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                    </span>
                  )}
                </div>
                
                {clients.length > 0 && !selectedClient && (
                  <div className="list-group position-absolute w-100 z-3">
                    {clients.map(client => (
                      <button 
                        key={client.id}
                        type="button"
                        className="list-group-item list-group-item-action"
                        onClick={() => handleClientSelect(client)}
                      >
                        <div className="d-flex w-100 justify-content-between">
                          <h6 className="mb-1">{client.full_name}</h6>
                          <small>Doc: {client.number_document}</small>
                        </div>
                        <small className="text-muted">{client.email}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedClient && (
                <div className="alert alert-info mt-3">
                  <h6 className="alert-heading">Cliente seleccionado:</h6>
                  <p className="mb-1"><strong>Nombre:</strong> {selectedClient.full_name}</p>
                  <p className="mb-1"><strong>Email:</strong> {selectedClient.email}</p>
                  <p className="mb-0"><strong>Documento:</strong> {selectedClient.number_document}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Panel de selección de producción */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title">Producciones del Cliente</h2>
              
              {!selectedClient ? (
                <div className="alert alert-secondary mb-0">
                  Seleccione un cliente para ver sus producciones
                </div>
              ) : loading ? (
                <div className="d-flex justify-content-center">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : productions.length === 0 ? (
                <div className="alert alert-warning mb-0">
                  El cliente no tiene producciones registradas
                </div>
              ) : (
                <div>
                  <select
                    className="form-select mb-3"
                    value={selectedProduction?.id || ''}
                    onChange={(e) => {
                      const prod = productions.find(p => p.id === parseInt(e.target.value));
                      handleProductionSelect(prod);
                    }}
                  >
                    <option value="">Seleccione una producción</option>
                    {productions.map(prod => (
                      <option key={prod.id} value={prod.id}>
                        Producción #{prod.id} - {formatDate(prod.fecha_opu || prod.created_at)}
                      </option>
                    ))}
                  </select>
                  
                  {selectedProduction && (
                    <div className="alert alert-success">
                      <h6 className="alert-heading">Producción seleccionada:</h6>
                      <p className="mb-1"><strong>ID:</strong> #{selectedProduction.id}</p>
                      <p className="mb-1"><strong>Fecha OPU:</strong> {formatDate(selectedProduction.fecha_opu)}</p>
                      <p className="mb-1"><strong>Lugar:</strong> {selectedProduction.lugar || 'No especificado'}</p>
                      <p className="mb-0"><strong>Finca:</strong> {selectedProduction.finca || 'No especificada'}</p>
                      {transfers.initial_report === false && (
                        <p className="mb-0 mt-2">
                          <small className="text-info">
                            <i className="bi bi-info-circle me-1"></i>
                            Mostrando datos guardados anteriormente
                          </small>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección para generar el informe */}
      {selectedProduction && (
        <div className="card mt-4">
          <div className="card-body">
            <h2 className="h5 card-title mb-4">Generar Informe de Transferencia</h2>
            
            <div className="row g-3">
              <div className="col-md-6">
                <label htmlFor="transferDate" className="form-label">Fecha de transferencia</label>
                <input
                  type="date"
                  className="form-control"
                  id="transferDate"
                  value={transfers.fecha_transferencia}
                  onChange={(e) => handleFormChange('fecha_transferencia', e.target.value)}
                />
              </div>
              
              <div className="col-md-6">
                <label htmlFor="veterinarian" className="form-label">Veterinario responsable</label>
                <input
                  type="text"
                  className="form-control"
                  id="veterinarian"
                  placeholder="Nombre del veterinario"
                  value={transfers.veterinario_responsable}
                  onChange={(e) => handleFormChange('veterinario_responsable', e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="lugar" className="form-label">Lugar</label>
                <input
                  type="text"
                  className="form-control"
                  id="lugar"
                  placeholder="Ingrese el lugar"
                  value={transfers.lugar}
                  onChange={(e) => handleFormChange('lugar', e.target.value)}
                />
              </div>

              <div className="col-md-6">
                <label htmlFor="finca" className="form-label">Finca</label>
                <input
                  type="text"
                  className="form-control"
                  id="finca"
                  placeholder="Ingrese la finca"
                  value={transfers.finca}
                  onChange={(e) => handleFormChange('finca', e.target.value)}
                />
              </div>
              
              <div className="col-12">
                <label htmlFor="observations" className="form-label">Observaciones</label>
                <textarea
                  className="form-control"
                  id="observations"
                  rows="8"
                  placeholder="Observaciones adicionales..."
                  value={transfers.observacion}
                  onChange={(e) => handleFormChange('observacion', e.target.value)}
                ></textarea>
              </div>
              
              <div className="col-12 d-flex justify-content-end">
                <button 
                  className="btn btn-primary"
                  onClick={handleGenerateReport}
                  disabled={loading || isReportSaved || transfers.initial_report === false}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Guardando...</span>
                      </div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-file-earmark-text me-2"></i>
                      Guardar Informe
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de transferencia */}
      {selectedProduction && transferRows.length > 0 && (
        <div className="card mt-4">
          <div className="card-body">
            <h2 className="h5 card-title mb-4">
              Registro de Transferencia
              {transfers.initial_report ? (
                <small className="text-muted ms-2">(Datos basados en OPUS)</small>
              ) : (
                <small className="text-success ms-2">(Datos guardados)</small>
              )}
            </h2>
            
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Donadora</th>
                    <th>Raza</th>
                    <th>Toro</th>
                    <th>Raza del Toro</th>
                    <th>Estado</th>
                    <th>Receptora</th>
                    <th>Horario</th>
                    <th>DX</th>
                    <th>DXX</th>
                    <th>DXXX</th>
                  </tr>
                </thead>
                <tbody>
                  {transferRows.map(row => (
                    <tr key={row.id}>
                      <td>{row.rowNumber}</td>
                      <td>{row.donadora}</td>
                      <td>{row.raza}</td>
                      <td>{row.toro}</td>
                      <td>{row.razaToro}</td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={rowsData[row.id]?.estado || ''}
                          onChange={(e) => handleRowDataChange(row.id, 'estado', e.target.value)}
                          placeholder="Estado"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={rowsData[row.id]?.receptora || ''}
                          onChange={(e) => handleRowDataChange(row.id, 'receptora', e.target.value)}
                          placeholder="Receptora"
                        />
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={rowsData[row.id]?.horario || 'D'}
                          onChange={(e) => handleRowDataChange(row.id, 'horario', e.target.value)}
                        >
                          {horarioOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={rowsData[row.id]?.dx || 'P+'}
                          onChange={(e) => handleRowDataChange(row.id, 'dx', e.target.value)}
                        >
                          {dxOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={rowsData[row.id]?.dxx || 'P+'}
                          onChange={(e) => handleRowDataChange(row.id, 'dxx', e.target.value)}
                        >
                          {dxOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={rowsData[row.id]?.dxxx || 'P+'}
                          onChange={(e) => handleRowDataChange(row.id, 'dxxx', e.target.value)}
                        >
                          {dxOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {loadingOpus && (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando datos...</span>
                </div>
              </div>
            )}

            {/* Botón para guardar cambios de la tabla */}
            <div className="d-flex justify-content-end mt-3">
              <button 
                className="btn btn-success"
                onClick={handleSaveTableChanges}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Guardando...</span>
                    </div>
                    Guardando cambios...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Guardar cambios de la tabla
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferReport;