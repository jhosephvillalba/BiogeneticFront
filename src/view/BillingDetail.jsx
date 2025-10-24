import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../Api/index.js';

const BillingDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Cargar datos de la factura completa
  useEffect(() => {
    const loadInvoiceComplete = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Cargando factura completa con ID:', id);
        
        // Verificar que api.billing.getInvoiceComplete existe
        if (!api.billing || !api.billing.getInvoiceComplete) {
          throw new Error('api.billing.getInvoiceComplete no está disponible');
        }
        
        const invoiceData = await api.billing.getInvoiceComplete(id);
        console.log('Datos de factura completa recibidos:', invoiceData);
        
        // La respuesta tiene estructura: { factura, detalles, pagos }
        setInvoice(invoiceData);
      } catch (error) {
        console.error('Error al cargar factura completa:', error);
        setError(error.message || 'Error al cargar los datos de la factura');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadInvoiceComplete();
    }
  }, [id]);

  const handleBack = () => {
    navigate('/billing');
  };

  const handleDownloadPDF = async () => {
    try {
      console.log('Descargando PDF para factura ID:', id);
      
      // Generar PDF usando el servicio
      const pdfBlob = await api.billing.generateInvoicePDF(id);
      
      // Crear URL del blob
      const url = window.URL.createObjectURL(pdfBlob);
      
      // Crear elemento de descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura_${invoice?.factura?.id_factura || id}.pdf`;
      
      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar la factura: ' + (error.message || 'Error desconocido'));
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center mb-4">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={handleBack}
                title="Volver a facturación"
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <h2 className="mb-0">
                <i className="bi bi-eye me-2"></i>
                Detalle de Factura #{id}
              </h2>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-3 text-muted">Cargando detalles de la factura...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error
  if (error) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="d-flex align-items-center mb-4">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={handleBack}
                title="Volver a facturación"
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <h2 className="mb-0">
                <i className="bi bi-eye me-2"></i>
                Detalle de Factura #{id}
              </h2>
            </div>
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Error al cargar la factura</h4>
              <p>{error}</p>
              <hr />
              <div className="d-flex gap-2">
                <button className="btn btn-outline-danger" onClick={() => window.location.reload()}>
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reintentar
                </button>
                <button className="btn btn-secondary" onClick={handleBack}>
                  <i className="bi bi-arrow-left me-2"></i>
                  Volver a Facturación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar contenido principal
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Header con botón de regreso */}
          <div className="d-flex align-items-center justify-content-between mb-4 mt-5">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-outline-secondary me-3"
                onClick={handleBack}
                title="Volver a facturación"
              >
                <i className="bi bi-arrow-left"></i>
              </button>
              <h2 className="mb-0">
                <i className="bi bi-eye me-2"></i>
                Detalle de Factura #{invoice?.factura?.id_factura || id}
              </h2>
            </div>
            <div className="d-flex gap-2">
              <button
                className="btn btn-success"
                onClick={handleDownloadPDF}
                title="Descargar factura en PDF"
              >
                <i className="bi bi-download me-2"></i>
                Descargar PDF
              </button>
            </div>
          </div>

          {/* Contenido principal */}
          {invoice ? (
            <>
              {/* Información General y Fechas */}
              <div className="row mb-4">
                {/* Columna Izquierda - Información General */}
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-info-circle me-2"></i>
                        Información General
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>Número de Factura:</strong>
                        <p className="text-muted mb-0">{invoice.factura?.id_factura || 'N/A'}</p>
                      </div>
                      <div className="mb-3">
                        <strong>Estado:</strong>
                        <p className="mb-0">
                          <span className={`badge bg-${getStatusBadge(invoice.factura?.estado)}`}>
                            {getStatusText(invoice.factura?.estado)}
                          </span>
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong>Cliente ID:</strong>
                        <p className="text-muted mb-0">{invoice.factura?.cliente_id || 'N/A'}</p>
                      </div>
                      <div className="mb-0">
                        <strong>Aplica IVA:</strong>
                        <p className="text-muted mb-0">
                          {invoice.factura?.aplica_iva ? 'Sí' : 'No'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columna Derecha - Fechas */}
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-calendar3 me-2"></i>
                        Fechas
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="mb-3">
                        <strong>Fecha de Creación:</strong>
                        <p className="text-muted mb-0">
                          {invoice.factura?.fecha_generacion 
                            ? new Date(invoice.factura.fecha_generacion).toLocaleDateString('es-ES')
                            : '-'
                          }
                        </p>
                      </div>
                      <div className="mb-3">
                        <strong>Fecha de Pago:</strong>
                        <p className="text-muted mb-0">
                          {invoice.factura?.fecha_pago 
                            ? new Date(invoice.factura.fecha_pago).toLocaleDateString('es-ES')
                            : 'No pagada'
                          }
                        </p>
                      </div>
                      <div className="mb-0">
                        <strong>Fecha de Vencimiento:</strong>
                        <p className="text-muted mb-0">
                          {invoice.factura?.fecha_vencimiento 
                            ? new Date(invoice.factura.fecha_vencimiento).toLocaleDateString('es-ES')
                            : 'Sin vencimiento'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              {invoice.factura?.descripcion && (
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-file-text me-2"></i>
                          Descripción
                        </h5>
                      </div>
                      <div className="card-body">
                        <p className="text-muted mb-0">{invoice.factura.descripcion}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items de la Factura */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-list-ul me-2"></i>
                        Items de la Factura
                      </h5>
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
                            {invoice.detalles && invoice.detalles.length > 0 ? (
                              (() => {
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
                                  const value = invoice.detalles[0][item.key];
                                  
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
                              })()
                            ) : (
                              <tr>
                                <td colSpan="2" className="text-center text-muted py-3">
                                  No hay detalles disponibles
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Montos */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-currency-dollar me-2"></i>
                        Resumen de Montos
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="row">
                        <div className="col-md-4">
                          <div className="text-center">
                            <strong>Monto Base</strong>
                            <p className="text-muted mb-0">
                              {invoice.factura?.monto_base 
                                ? `$${parseFloat(invoice.factura.monto_base).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                : '-'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="text-center">
                            <strong>IVA ({invoice.factura?.iva_porcentaje || 0}%)</strong>
                            <p className="text-muted mb-0">
                              {invoice.factura?.valor_iva 
                                ? `$${parseFloat(invoice.factura.valor_iva).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                : '-'
                              }
                            </p>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="text-center">
                            <strong>Total a Pagar</strong>
                            <p className="text-success fw-bold fs-5 mb-0">
                              {invoice.factura?.monto_total 
                                ? `$${parseFloat(invoice.factura.monto_total).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
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


              {/* Historial de Pagos */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">
                        <i className="bi bi-clock-history me-2"></i>
                        Historial de Pagos
                      </h5>
                    </div>
                    <div className="card-body p-0">
                      {invoice.pagos && invoice.pagos.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th className="ps-3">Fecha de Pago</th>
                                <th>Monto</th>
                                <th>Método de Pago</th>
                                <th>Estado</th>
                                <th className="pe-3">Observaciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.pagos.map((pago, index) => (
                                <tr key={index}>
                                  <td className="ps-3">
                                    {pago.fecha_pago 
                                      ? new Date(pago.fecha_pago).toLocaleDateString('es-ES')
                                      : '-'
                                    }
                                  </td>
                                  <td className="fw-bold">
                                    {pago.monto 
                                      ? `$${parseFloat(pago.monto).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`
                                      : '-'
                                    }
                                  </td>
                                  <td>{pago.metodo_pago || '-'}</td>
                                  <td>
                                    <span className={`badge bg-${getStatusBadge(pago.estado)}`}>
                                      {getStatusText(pago.estado)}
                                    </span>
                                  </td>
                                  <td className="pe-3">{pago.observaciones || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <i className="bi bi-credit-card display-4"></i>
                          <p className="mt-2 mb-0">No hay pagos registrados para esta factura</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="card">
              <div className="card-body">
                <div className="text-center py-5">
                  <i className="bi bi-exclamation-triangle display-1 text-warning"></i>
                  <h4 className="mt-3 text-muted">Factura no encontrada</h4>
                  <p className="text-muted">
                    No se pudo encontrar la factura con ID #{id}.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={handleBack}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Volver a Facturación
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingDetail;
