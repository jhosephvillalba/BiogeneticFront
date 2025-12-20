import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../Api/index.js';

const ClientBilling = () => {
  // const navigate = useNavigate(); // No se usa actualmente, pero se mantiene para futuras navegaciones
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const epaycoFormRef = useRef(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: ''
  });

  const invoicesPerPage = 15;

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pendiente': 'warning',
      'retraso': 'danger',
      'pagado': 'success',
      'vencida': 'danger',
      'Pendiente': 'warning',
      'Retraso': 'danger',
      'Pagado': 'success',
      'Vencida': 'danger'
    };
    return statusConfig[status] || 'secondary';
  };

  const getStatusText = (status) => {
    const statusTexts = {
      'pendiente': 'Pendiente',
      'retraso': 'En Retraso',
      'pagado': 'Pagado',
      'vencida': 'Vencida',
      'Pendiente': 'Pendiente',
      'Retraso': 'En Retraso',
      'Pagado': 'Pagado',
      'Vencida': 'Vencida'
    };
    return statusTexts[status] || status;
  };

  useEffect(() => {
    loadInvoices();
    checkEpaycoResponse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filters]);

  // Verificar si hay respuesta de ePayco en sessionStorage
  const checkEpaycoResponse = () => {
    try {
      const savedResponse = sessionStorage.getItem('epayco_response');
      if (savedResponse) {
        const responseData = JSON.parse(savedResponse);
        console.log('Respuesta de ePayco:', responseData);
        
        // Aquí puedes procesar la respuesta
        // Por ejemplo, mostrar un mensaje o actualizar la factura
        if (responseData.x_cod_response === '1') {
          // Pago exitoso
          console.log('Pago exitoso para factura:', responseData.factura_id);
        }
        
        // Limpiar sessionStorage después de procesar
        // sessionStorage.removeItem('epayco_response');
      }
    } catch (error) {
      console.error('Error al leer respuesta de ePayco:', error);
    }
  };

  // Insertar script de ePayco
  useEffect(() => {
    if (showPaymentModal && selectedInvoice && epaycoFormRef.current) {
      const form = epaycoFormRef.current;
      form.innerHTML = '';
      
      const amount = Math.round(parseFloat(selectedInvoice.monto_pagar || 0));
      const tax = parseFloat((selectedInvoice.monto_base || 0) * (selectedInvoice.iva_porcentaje || 0) / 100).toFixed(2);
      const taxBase = Math.round(parseFloat(selectedInvoice.monto_base || 0));
      const invoiceName = selectedInvoice.id_factura || selectedInvoice.id;
      const invoiceDescription = (selectedInvoice.descripcion || `Pago de factura ${selectedInvoice.id_factura || selectedInvoice.id}`).replace(/'/g, "&#39;");
      const invoiceId = selectedInvoice.id;
      
      const responseUrl = `https://admin.biogenetic.com.co/pagos/response?factura_id=${invoiceId}`;
      
      // Log de la URL de respuesta de ePayco
      console.log('🔗 URL de respuesta de ePayco:', responseUrl);
      
      form.innerHTML = `
        <script src='https://checkout.epayco.co/checkout.js'
            data-epayco-key='f87a61bc0caebd8dc52a251e55083498' 
            class='epayco-button' 
            data-epayco-amount='${amount}' 
            data-epayco-tax='${tax}'  
            data-epayco-tax-ico='0.00'               
            data-epayco-tax-base='${taxBase}'
            data-epayco-name='${invoiceName}' 
            data-epayco-description='${invoiceDescription}' 
            data-epayco-currency='cop'    
            data-epayco-country='CO' 
            data-epayco-test='true' 
            data-epayco-external='false' 
            data-epayco-response='${responseUrl}'  
            data-epayco-confirmation='https://api.biogenetic.com.co/api/pagos/confirmation' 
            data-epayco-button='https://multimedia.epayco.co/dashboard/btns/btn5.png'> 
        </script>
      `;
      
      const scripts = form.getElementsByTagName('script');
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const newScript = document.createElement('script');
        Array.from(script.attributes).forEach(attr => {
          newScript.setAttribute(attr.name, attr.value);
        });
        script.parentNode.replaceChild(newScript, script);
      }
      
      return () => {
        if (form) form.innerHTML = '';
      };
    }
  }, [showPaymentModal, selectedInvoice]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      const apiFilters = {
        skip: (currentPage - 1) * invoicesPerPage,
        limit: invoicesPerPage
      };

      if (filters.startDate) {
        apiFilters.fecha_desde = new Date(filters.startDate).toISOString();
      }
      
      if (filters.endDate) {
        apiFilters.fecha_hasta = new Date(filters.endDate).toISOString();
      }
      
      if (filters.status) {
        apiFilters.estado = filters.status.toLowerCase();
      }

      const invoicesData = await api.billing.getMyInvoices(apiFilters);
      
      let invoicesList = [];
      if (Array.isArray(invoicesData)) {
        invoicesList = invoicesData;
      } else if (invoicesData && Array.isArray(invoicesData.data)) {
        invoicesList = invoicesData.data;
      } else if (invoicesData && Array.isArray(invoicesData.facturas)) {
        invoicesList = invoicesData.facturas;
      }
      
      setInvoices(invoicesList);
      
      const total = invoicesData.total || invoicesData.count || invoicesList.length;
      setTotalPages(Math.ceil(total / invoicesPerPage));
    } catch (error) {
      console.error('Error al cargar facturas:', error);
      alert('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDescription = async (invoice) => {
    try {
      const invoiceDetails = await api.billing.getInvoiceDetails(invoice.id);
      
      const detailsData = Array.isArray(invoiceDetails) && invoiceDetails.length > 0 
        ? invoiceDetails[0] 
        : {};
      
      const combinedData = {
        ...invoice,
        ...detailsData
      };
      
      setSelectedInvoice(combinedData);
      setShowDescriptionModal(true);
    } catch (error) {
      console.error('Error al obtener detalles de la factura:', error);
      setSelectedInvoice(invoice);
      setShowDescriptionModal(true);
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      const pdfBlob = await api.billing.generateInvoicePDF(invoice.id);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura_${invoice.id_factura || invoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar factura:', error);
      alert('Error al descargar la factura: ' + (error.message || 'Error desconocido'));
    }
  };

  const handleMakePayment = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentModal(true);
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'pagado' || status === 'Pagado') return false;
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <i className="bi bi-receipt me-2"></i>
              Mis Facturas
            </h2>
          </div>

          {/* Filtros */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-funnel me-2"></i>
                Filtros
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-3">
                  <label htmlFor="startDate" className="form-label">Fecha Desde</label>
                  <input
                    type="date"
                    className="form-control"
                    id="startDate"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="endDate" className="form-label">Fecha Hasta</label>
                  <input
                    type="date"
                    className="form-control"
                    id="endDate"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="status" className="form-label">Estado</label>
                  <select
                    className="form-select"
                    id="status"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="retraso">En Retraso</option>
                    <option value="vencida">Vencida</option>
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => setFilters({ startDate: '', endDate: '', status: '' })}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i>
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de Facturas */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Facturas ({invoices.length})
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
                  <p className="mt-2">No hay facturas que coincidan con los filtros</p>
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Número</th>
                          <th>Fecha Creación</th>
                          <th>Fecha Pago</th>
                          <th>Fecha Vencimiento</th>
                          <th>Monto</th>
                          <th>Estado</th>
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
                              {invoice.fecha_pago 
                                ? new Date(invoice.fecha_pago).toLocaleDateString('es-ES')
                                : '-'
                              }
                            </td>
                            <td>
                              {invoice.fecha_vencimiento ? (
                                <span className={isOverdue(invoice.fecha_vencimiento, invoice.estado) ? 'text-danger fw-bold' : ''}>
                                  {new Date(invoice.fecha_vencimiento).toLocaleDateString('es-ES')}
                                </span>
                              ) : (
                                <span className="text-muted">Sin vencimiento</span>
                              )}
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
                              <span className={`badge bg-${getStatusBadge(invoice.estado)}`}>
                                {getStatusText(invoice.estado)}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex gap-2" role="group">
                                <button
                                  className="btn btn-info btn-sm"
                                  onClick={() => handleViewDescription(invoice)}
                                  title="Ver descripción de la factura"
                                >
                                  <i className="bi bi-eye me-1"></i>
                                  Ver
                                </button>
                                <button
                                  className="btn btn-success btn-sm"
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  title="Descargar factura en PDF"
                                >
                                  <i className="bi bi-download me-1"></i>
                                  PDF
                                </button>
                                {invoice.estado !== 'pagado' && (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleMakePayment(invoice)}
                                    title="Realizar pago de la factura"
                                  >
                                    <i className="bi bi-credit-card me-1"></i>
                                    Pagar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <div className="text-muted">
                        <small>
                          Mostrando {((currentPage - 1) * invoicesPerPage) + 1} - {Math.min(currentPage * invoicesPerPage, invoices.length)} de {invoices.length} facturas
                        </small>
                      </div>
                      
                      <nav aria-label="Paginación de facturas">
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              title="Primera página"
                            >
                              <i className="bi bi-chevron-double-left"></i>
                            </button>
                          </li>
                          
                          <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              title="Página anterior"
                            >
                              <i className="bi bi-chevron-left"></i>
                            </button>
                          </li>
                          
                          {(() => {
                            const pages = [];
                            const maxVisiblePages = 5;
                            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                            
                            if (endPage - startPage + 1 < maxVisiblePages) {
                              startPage = Math.max(1, endPage - maxVisiblePages + 1);
                            }
                            
                            for (let i = startPage; i <= endPage; i++) {
                              pages.push(
                                <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
                                  <button
                                    className="page-link"
                                    onClick={() => handlePageChange(i)}
                                  >
                                    {i}
                                  </button>
                                </li>
                              );
                            }
                            return pages;
                          })()}
                          
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              title="Página siguiente"
                            >
                              <i className="bi bi-chevron-right"></i>
                            </button>
                          </li>
                          
                          <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              title="Última página"
                            >
                              <i className="bi bi-chevron-double-right"></i>
                            </button>
                          </li>
                        </ul>
                      </nav>
                      
                      <div className="text-muted">
                        <small>
                          Página {currentPage} de {totalPages}
                        </small>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Descripción */}
      {showDescriptionModal && selectedInvoice && (
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
                  onClick={() => setShowDescriptionModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
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
                              {[
                                { key: 'embrio_fresco', name: 'Embrión Fresco' },
                                { key: 'embrio_congelado', name: 'Embrión Congelado' },
                                { key: 'material_campo', name: 'Material de Campo' },
                                { key: 'nitrogeno', name: 'Nitrógeno' },
                                { key: 'mensajeria', name: 'Mensajería' },
                                { key: 'pajilla_semen', name: 'Pajilla de Semen' },
                                { key: 'fundas_te', name: 'Fundas T.E' }
                              ].map((item) => {
                                const value = selectedInvoice[item.key];
                                return (
                                  <tr key={item.key}>
                                    <td className="ps-3">{item.name}</td>
                                    <td className="text-end pe-3 fw-bold">
                                      {value && value > 0 
                                        ? `$${parseFloat(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                        : '$0.00'
                                      }
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

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
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDescriptionModal(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago con ePayco */}
      {showPaymentModal && selectedInvoice && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-credit-card me-2"></i>
                  Realizar Pago - Factura {selectedInvoice.id_factura || selectedInvoice.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowPaymentModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <h4>Monto a Pagar</h4>
                  <h2 className="text-primary">
                    {selectedInvoice.monto_pagar 
                      ? `$${parseFloat(selectedInvoice.monto_pagar).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                      : '-'
                    }
                  </h2>
                </div>
                
                <div className="card mb-4">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>Número de Factura:</strong> {selectedInvoice.id_factura || selectedInvoice.id}
                        </p>
                        <p className="mb-2">
                          <strong>Monto Base:</strong> ${parseFloat(selectedInvoice.monto_base || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-2">
                          <strong>IVA ({selectedInvoice.iva_porcentaje || 0}%):</strong> ${parseFloat((selectedInvoice.monto_base || 0) * (selectedInvoice.iva_porcentaje || 0) / 100).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="mb-0">
                          <strong>Total:</strong> ${parseFloat(selectedInvoice.monto_pagar || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <form ref={epaycoFormRef}></form>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientBilling;