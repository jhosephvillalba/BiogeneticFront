import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../Api/index.js';
import ClientSearchSelect from '../Components/ClientSearchSelect.jsx';

const Billing = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const invoicesPerPage = 10;

  // Estados de factura
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pendiente': 'warning',
      'retraso': 'danger',
      'pagado': 'success',
      'Pendiente': 'warning',
      'Retraso': 'danger',
      'Pagado': 'success'
    };
    return statusConfig[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'pendiente': 'Pendiente',
      'retraso': 'En Retraso',
      'pagado': 'Pagado',
      'Pendiente': 'Pendiente',
      'Retraso': 'En Retraso',
      'Pagado': 'Pagado'
    };
    return statusTexts[status] || status;
  };

  // Cargar clientes al montar el componente
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        console.log('Cargando clientes...');
        // Obtener usuarios con rol 3 (Clientes) - probar ambas funciones
        let clientsData;
        try {
          clientsData = await api.users.filterUsers({ role_id: 3 }, 0, 1000);
          console.log('Respuesta de filterUsers:', clientsData);
        } catch (error) {
          console.log('Error con filterUsers, probando searchUsers:', error);
          try {
            clientsData = await api.users.searchUsers({ role_id: 3 }, 0, 1000);
            console.log('Respuesta de searchUsers:', clientsData);
          } catch (error2) {
            console.log('Error con searchUsers, probando getUsers:', error2);
            clientsData = await api.users.getUsers(0, 1000);
            console.log('Respuesta de getUsers:', clientsData);
          }
        }
        
        // Manejar diferentes estructuras de respuesta
        let clientsList = [];
        if (Array.isArray(clientsData)) {
          clientsList = clientsData;
        } else if (clientsData && Array.isArray(clientsData.data)) {
          clientsList = clientsData.data;
        } else if (clientsData && Array.isArray(clientsData.users)) {
          clientsList = clientsData.users;
        }
        
        // Filtrar solo usuarios con rol 3 (Clientes) si es necesario
        if (clientsList.length > 0) {
          clientsList = clientsList.filter(user => {
            // Verificar si tiene roles y si alguno es rol 3
            if (user.roles && Array.isArray(user.roles)) {
              return user.roles.some(role => role.id === 3 || role.name === 'Client');
            }
            // Si no tiene roles definidos, asumir que es cliente si no es admin
            return user.role_id === 3 || user.role === 'Client';
          });
        }
        
        console.log('Clientes procesados:', clientsList);
        setClients(clientsList);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
        alert('Error al cargar la lista de clientes: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Cargar facturas cuando se selecciona un cliente
  useEffect(() => {
    if (selectedClient) {
      loadInvoices();
    }
  }, [selectedClient, currentPage]);

  // Verificar que la API esté disponible al cargar el componente
  useEffect(() => {
    console.log('API disponible:', api);
    console.log('API billing disponible:', api.billing);
    if (api.billing) {
      console.log('Métodos de billing disponibles:', Object.keys(api.billing));
    }
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Validar que hay un cliente seleccionado
      if (!selectedClient || !selectedClient.id) {
        console.warn('No hay cliente seleccionado para cargar facturas');
        setInvoices([]);
        setTotalPages(1);
        return;
      }
      
      console.log('Cargando facturas para cliente:', selectedClient.id);
      
      // Verificar que api.billing.getInvoices existe
      if (!api.billing || !api.billing.getInvoices) {
        throw new Error('api.billing.getInvoices no está disponible');
      }
      
      // Usar la API real para obtener facturas del cliente
      const skip = (currentPage - 1) * invoicesPerPage;
      const filters = {
        skip,
        limit: invoicesPerPage,
        cliente_id: selectedClient.id, // ✅ Requerido: pasar el ID del cliente
      };
      
      console.log('Filtros para cargar facturas:', filters);
      const invoicesData = await api.billing.getInvoices(filters);
      console.log('Datos de facturas recibidos:', invoicesData);
      
      // Manejar diferentes estructuras de respuesta
      let invoicesList = [];
      if (Array.isArray(invoicesData)) {
        invoicesList = invoicesData;
      } else if (invoicesData && Array.isArray(invoicesData.data)) {
        invoicesList = invoicesData.data;
      } else if (invoicesData && Array.isArray(invoicesData.facturas)) {
        invoicesList = invoicesData.facturas;
      }
      
      console.log('Lista de facturas procesada:', invoicesList);
      
      // Debug: mostrar la estructura de la primera factura si existe
      if (invoicesList.length > 0) {
        console.log('Estructura de la primera factura:', invoicesList[0]);
        console.log('Campos de la factura:', Object.keys(invoicesList[0]));
      }
      
      setInvoices(invoicesList);
      
      // Calcular total de páginas
      const total = invoicesData.total || invoicesData.count || invoicesList.length;
      setTotalPages(Math.ceil(total / invoicesPerPage));
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      console.error('Error stack:', error.stack);
      alert('Error al cargar las facturas del cliente: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setCurrentPage(1); // Resetear a la primera página
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewInvoice = (invoice) => {
    navigate(`/billing/detail/${invoice.id}`);
  };

  const handleCreateInvoice = () => {
    if (!selectedClient) {
      alert('Por favor selecciona un cliente primero');
      return;
    }
    navigate('/billing/create', { state: { client: selectedClient } });
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      console.log('Descargando factura:', invoice.id_factura || invoice.id);
      
      // Generar PDF usando el servicio
      const pdfBlob = await api.billing.generateInvoicePDF(invoice.id);
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(pdfBlob);
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura_${invoice.id_factura || invoice.id}.pdf`;
      
      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar factura:', error);
      alert('Error al descargar la factura: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleDeleteInvoice = async (invoice) => {
    try {
      // Verificar si la factura está pagada
      if (invoice.estado === 'pagado' || invoice.estado === 'Pagado') {
        alert('No se puede eliminar una factura que ya ha sido pagada.');
        return;
      }

      // Confirmar eliminación
      const confirmMessage = `¿Estás seguro de que deseas eliminar la factura ${invoice.id_factura || invoice.id}?\n\nEsta acción no se puede deshacer.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      console.log('Eliminando factura:', invoice.id);
      
      // Verificar que api.billing.deleteInvoice existe
      if (!api.billing || !api.billing.deleteInvoice) {
        throw new Error('api.billing.deleteInvoice no está disponible');
      }
      
      // Eliminar factura usando el servicio
      await api.billing.deleteInvoice(invoice.id);
      
      console.log('Factura eliminada exitosamente');
      
      // Mostrar mensaje de éxito
      alert('Factura eliminada exitosamente');
      
      // Recargar la lista de facturas
      await loadInvoices();
      
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      alert('Error al eliminar la factura: ' + (error.message || 'Error desconocido'));
    }
  };


  try {
    return (
      <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4 mt-5">
            <h2 className="mb-0">
              <i className="bi bi-receipt me-2"></i>
              Facturación
            </h2>
          </div>

          {/* Filtro de Clientes */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Seleccionar Cliente
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <div className="mb-3">
                    <label className="form-label">
                      Buscar y Seleccionar Cliente
                    </label>
                    <ClientSearchSelect
                      clients={clients}
                      onClientSelect={handleClientSelect}
                      selectedClient={selectedClient}
                      loading={loading}
                      placeholder="Buscar por nombre o email..."
                    />
                  </div>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <div className="mb-3 w-100">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={() => setSelectedClient(null)}
                      disabled={!selectedClient}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Limpiar Selección
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Cliente Seleccionado */}
          {selectedClient && (
            <div className="card mb-4">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-8">
                    <h5 className="card-title">
                      <i className="bi bi-person-circle me-2"></i>
                      {selectedClient.full_name}
                    </h5>
                    <p className="card-text">
                      <strong>Email:</strong> {selectedClient.email}<br/>
                      <strong>Teléfono:</strong> {selectedClient.phone || 'No disponible'}<br/>
                      <strong>Documento:</strong> {selectedClient.number_document} ({selectedClient.type_document})<br/>
                      <strong>Especialidad:</strong> {selectedClient.specialty}
                    </p>
                  </div>
                  <div className="col-md-4 text-end">
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateInvoice}
                    >
                      <i className="bi bi-plus-circle me-2"></i>
                      Generar Nueva Factura
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabla de Facturas */}
          {selectedClient && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>
                  Facturas del Cliente
                </h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-inbox display-4"></i>
                    <p className="mt-2">No hay facturas para este cliente</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Número de Factura</th>
                            <th>Fecha de Generación</th>
                            <th>Estado</th>
                            <th>Fecha de Pago</th>
                            <th>Monto Total</th>
                            <th>Fecha de Vencimiento</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map(invoice => (
                            <tr key={invoice.id}>
                              <td>
                                <strong>{invoice.id_factura || 'N/A'}</strong>
                              </td>
                              <td>
                                {invoice.fecha_generacion 
                                  ? new Date(invoice.fecha_generacion).toLocaleDateString('es-ES')
                                  : '-'
                                }
                              </td>
                              <td>
                                <span className={`badge bg-${getStatusBadge(invoice.estado)}`}>
                                  {getStatusText(invoice.estado)}
                                </span>
                              </td>
                              <td>
                                {invoice.fecha_pago 
                                  ? new Date(invoice.fecha_pago).toLocaleDateString('es-ES')
                                  : '-'
                                }
                              </td>
                              <td>
                                <strong>
                                  {invoice.monto_pagar 
                                    ? `$${parseFloat(invoice.monto_pagar).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                    : '-'
                                  }
                                </strong>
                              </td>
                              <td>
                                {invoice.fecha_vencimiento 
                                  ? new Date(invoice.fecha_vencimiento).toLocaleDateString('es-ES')
                                  : '-'
                                }
                              </td>
                              <td>
                                <span className="text-muted" title={invoice.descripcion || ''}>
                                  {invoice.descripcion 
                                    ? (invoice.descripcion.length > 30 
                                        ? `${invoice.descripcion.substring(0, 30)}...`
                                        : invoice.descripcion
                                      )
                                    : '-'
                                  }
                                </span>
                              </td>
                              <td>
                                <div className="d-flex gap-2" role="group">
                                  <button
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => handleViewInvoice(invoice)}
                                    title="Ver detalle de la factura"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-success btn-sm"
                                    onClick={() => handleDownloadInvoice(invoice)}
                                    title="Descargar factura en PDF"
                                  >
                                    <i className="bi bi-download"></i>
                                  </button>
                                  <button
                                    className={`btn btn-sm ${
                                      invoice.estado === 'pagado' || invoice.estado === 'Pagado'
                                        ? 'btn-outline-secondary'
                                        : 'btn-outline-danger'
                                    }`}
                                    onClick={() => handleDeleteInvoice(invoice)}
                                    disabled={invoice.estado === 'pagado' || invoice.estado === 'Pagado'}
                                    title={
                                      invoice.estado === 'pagado' || invoice.estado === 'Pagado'
                                        ? 'No se puede eliminar una factura pagada'
                                        : 'Eliminar factura'
                                    }
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <nav aria-label="Paginación de facturas">
                        <ul className="pagination justify-content-center">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Anterior
                            </button>
                          </li>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          ))}
                          
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Siguiente
                            </button>
                          </li>
                        </ul>
                      </nav>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalle de Factura */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-file-text me-2"></i>
                  Detalle de Factura - {selectedInvoice.id_factura || 'N/A'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowInvoiceModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                {selectedInvoice ? (
                  <>
                    <div className="row">
                      {/* Columna Izquierda - Información General */}
                      <div className="col-md-6">
                        <div className="card h-100">
                          <div className="card-header">
                            <h6 className="mb-0">
                              <i className="bi bi-info-circle me-2"></i>
                              Información General
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-3">
                              <strong>Número de Factura:</strong>
                              <p className="text-muted mb-0">{selectedInvoice.id_factura || 'N/A'}</p>
                            </div>
                            <div className="mb-3">
                              <strong>Estado:</strong>
                              <p className="mb-0">
                                <span className={`badge bg-${getStatusBadge(selectedInvoice.estado)}`}>
                                  {getStatusText(selectedInvoice.estado)}
                                </span>
                              </p>
                            </div>
                            <div className="mb-3">
                              <strong>Cliente ID:</strong>
                              <p className="text-muted mb-0">{selectedInvoice.cliente_id || 'N/A'}</p>
                            </div>
                            <div className="mb-0">
                              <strong>Aplica IVA:</strong>
                              <p className="text-muted mb-0">
                                {selectedInvoice.aplica_iva ? 'Sí' : 'No'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Columna Derecha - Fechas */}
                      <div className="col-md-6">
                        <div className="card h-100">
                          <div className="card-header">
                            <h6 className="mb-0">
                              <i className="bi bi-calendar3 me-2"></i>
                              Fechas
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="mb-3">
                              <strong>Fecha de Creación:</strong>
                              <p className="text-muted mb-0">
                                {selectedInvoice.fecha_generacion 
                                  ? new Date(selectedInvoice.fecha_generacion).toLocaleDateString('es-ES')
                                  : '-'
                                }
                              </p>
                            </div>
                            <div className="mb-3">
                              <strong>Fecha de Pago:</strong>
                              <p className="text-muted mb-0">
                                {selectedInvoice.fecha_pago 
                                  ? new Date(selectedInvoice.fecha_pago).toLocaleDateString('es-ES')
                                  : 'No pagada'
                                }
                              </p>
                            </div>
                            <div className="mb-0">
                              <strong>Fecha de Vencimiento:</strong>
                              <p className="text-muted mb-0">
                                {selectedInvoice.fecha_vencimiento 
                                  ? new Date(selectedInvoice.fecha_vencimiento).toLocaleDateString('es-ES')
                                  : 'Sin vencimiento'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    {selectedInvoice.descripcion && (
                      <div className="row mt-3">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">
                                <i className="bi bi-file-text me-2"></i>
                                Descripción
                              </h6>
                            </div>
                            <div className="card-body">
                              <p className="text-muted mb-0">{selectedInvoice.descripcion}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Items de la Factura */}
                    <div className="row mt-3">
                      <div className="col-12">
                        <div className="card">
                          <div className="card-header">
                            <h6 className="mb-0">
                              <i className="bi bi-list-ul me-2"></i>
                              Items de la Factura
                            </h6>
                          </div>
                          <div className="card-body p-0">
                            <div className="table-responsive">
                              <table className="table table-hover mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th className="ps-3">Item</th>
                                    <th className="text-end pe-3">Valor</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const items = [
                                      { key: 'embrio_fresco', name: 'Embrión Fresco' },
                                      { key: 'embrio_congelado', name: 'Embrión Congelado' },
                                      { key: 'material_campo', name: 'Material de Campo' },
                                      { key: 'nitrogeno', name: 'Nitrógeno' },
                                      { key: 'mensajeria', name: 'Mensajería' },
                                      { key: 'pajilla_semen', name: 'Pajilla de Semen' },
                                      { key: 'fundas_te', name: 'Fundas T.E' }
                                    ];

                                    return items.map((item, index) => {
                                      const value = selectedInvoice[item.key];
                                      
                                      return (
                                        <tr key={index}>
                                          <td className="ps-3">{item.name}</td>
                                          <td className="text-end pe-3 fw-bold">
                                            {value && value > 0 
                                              ? `$${parseFloat(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                              : '$0.00'
                                            }
                                          </td>
                                        </tr>
                                      );
                                    });
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resumen de Montos */}
                    <div className="row mt-3">
                      <div className="col-12">
                        <div className="card">
                          <div className="card-header">
                            <h6 className="mb-0">
                              <i className="bi bi-currency-dollar me-2"></i>
                              Resumen de Montos
                            </h6>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-md-4">
                                <div className="text-center">
                                  <strong>Monto Base</strong>
                                  <p className="text-muted mb-0">
                                    {selectedInvoice.monto_base 
                                      ? `$${parseFloat(selectedInvoice.monto_base).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                      : '-'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="text-center">
                                  <strong>IVA ({selectedInvoice.iva_porcentaje || 0}%)</strong>
                                  <p className="text-muted mb-0">
                                    {selectedInvoice.iva_porcentaje 
                                      ? `$${(selectedInvoice.monto_base * selectedInvoice.iva_porcentaje / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                      : '-'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="col-md-4">
                                <div className="text-center">
                                  <strong>Total a Pagar</strong>
                                  <p className="text-success fw-bold fs-5 mb-0">
                                    {selectedInvoice.monto_pagar 
                                      ? `$${parseFloat(selectedInvoice.monto_pagar).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                      : '-'
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <p className="mt-2">Cargando detalles de la factura...</p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInvoiceModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('Error en el render del componente Billing:', error);
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Error en la vista de Facturación</h4>
              <p>Ha ocurrido un error al cargar la vista de facturación. Por favor, recarga la página.</p>
              <hr />
              <p className="mb-0">
                <small>Error: {error.message}</small>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Billing;
