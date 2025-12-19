import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../Api/index.js';

const PaymentResult = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentInfo, setPaymentInfo] = useState({
    ref_payco: '',
    estado: '',
    respuesta: ''
  });
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);

  // Función para crear el registro de pago usando los servicios de payments.js
  const createPaymentRecord = useCallback(async (ref_payco, estado, factura_id_param, monto_param) => {
    try {
      // Obtener factura_id desde parámetros o localStorage
      const invoiceId = factura_id_param || localStorage.getItem('pendingPaymentInvoiceId');
      
      if (!invoiceId) {
        console.warn('No se encontró factura_id para crear el registro de pago');
        return;
      }

      // Verificar que no se haya creado ya el pago
      if (paymentCreated) {
        return;
      }

      setCreatingPayment(true);
      console.log('Creando registro de pago con datos de ePayco:', {
        ref_payco,
        estado,
        factura_id: invoiceId,
        monto: monto_param
      });

      // Determinar el estado del pago según la respuesta de ePayco
      const estadoLower = estado.toLowerCase();
      let paymentStatus = 'pendiente';
      
      if (estadoLower === 'aceptada' || estadoLower === 'aprobado' || estadoLower === 'success') {
        paymentStatus = 'aprobado';
      } else if (estadoLower === 'rechazada' || estadoLower === 'fallida' || estadoLower === 'failed') {
        paymentStatus = 'rechazado';
      }

      // Obtener monto desde parámetros o intentar obtenerlo de la factura
      let monto = null;
      if (monto_param) {
        monto = parseFloat(monto_param);
      } else {
        // Intentar obtener el monto desde la factura si no viene en los parámetros
        try {
          const invoiceData = await api.billing.getInvoiceById(parseInt(invoiceId));
          monto = invoiceData.monto_pagar || invoiceData.monto_total || null;
          console.log('Monto obtenido desde la factura:', monto);
        } catch (error) {
          console.warn('No se pudo obtener el monto desde la factura:', error);
          // El monto puede ser null, el backend puede calcularlo desde la factura
        }
      }

      // Crear el registro de pago usando el servicio
      const paymentData = {
        factura_id: parseInt(invoiceId),
        ref_payco: ref_payco,
        metodo_pago: 'epayco',
        monto: monto,
        estado: paymentStatus,
        observaciones: `Pago procesado a través de ePayco. Referencia: ${ref_payco}. Estado: ${estado}`
      };

      console.log('Datos del pago a crear:', paymentData);

      // Verificar que api.payments existe
      if (!api.payments) {
        throw new Error('api.payments no está disponible');
      }

      // Intentar crear el pago manual (ya que ePayco procesa el pago externamente)
      const paymentResponse = await api.payments.createManualPayment(paymentData);
      console.log('Registro de pago creado exitosamente:', paymentResponse);
      
      setPaymentCreated(true);
      
      // Limpiar el factura_id del localStorage
      localStorage.removeItem('pendingPaymentInvoiceId');
      
    } catch (error) {
      console.error('Error al crear registro de pago:', error);
      // No mostrar error al usuario, solo loguearlo
      // El pago ya fue procesado por ePayco, solo falló el registro local
    } finally {
      setCreatingPayment(false);
    }
  }, []);

  useEffect(() => {
    // Leer los parámetros de la query string
    const ref_payco = searchParams.get('ref_payco') || '';
    const estado = searchParams.get('estado') || '';
    const respuesta = searchParams.get('respuesta') || '';
    const factura_id = searchParams.get('factura_id') || '';
    // ePayco puede enviar el monto en diferentes parámetros
    const monto = searchParams.get('monto') || searchParams.get('valor') || searchParams.get('amount') || '';

    setPaymentInfo({
      ref_payco,
      estado,
      respuesta
    });

    console.log('Parámetros de pago recibidos:', { ref_payco, estado, respuesta, factura_id, monto });
    
    // Crear registro de pago si hay datos válidos
    if (ref_payco && estado && !paymentCreated) {
      createPaymentRecord(ref_payco, estado, factura_id, monto);
    }
  }, [searchParams, createPaymentRecord, paymentCreated]);

  const handleBack = () => {
    navigate('/client/billing');
  };

  // Determinar el color y el icono según el estado
  const getStatusStyle = (estado) => {
    const estadoLower = estado.toLowerCase();
    
    if (estadoLower === 'aceptada' || estadoLower === 'aprobado' || estadoLower === 'success') {
      return {
        color: 'success',
        icon: 'bi-check-circle-fill',
        title: 'Pago Exitoso'
      };
    } else if (estadoLower === 'pendiente' || estadoLower === 'pending') {
      return {
        color: 'warning',
        icon: 'bi-clock-fill',
        title: 'Pago Pendiente'
      };
    } else if (estadoLower === 'rechazada' || estadoLower === 'fallida' || estadoLower === 'failed') {
      return {
        color: 'danger',
        icon: 'bi-x-circle-fill',
        title: 'Pago Fallido'
      };
    } else {
      return {
        color: 'info',
        icon: 'bi-info-circle-fill',
        title: 'Estado del Pago'
      };
    }
  };

  const statusStyle = getStatusStyle(paymentInfo.estado);

  return (
    <div className="container-fluid py-5">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card shadow">
            <div className={`card-header bg-${statusStyle.color} text-white`}>
              <h3 className="mb-0 text-center">
                <i className={`bi ${statusStyle.icon} me-2`}></i>
                {statusStyle.title}
              </h3>
            </div>
            <div className="card-body p-4">
              {/* Indicador de creación de registro */}
              {creatingPayment && (
                <div className="alert alert-info mb-4">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span>Registrando el pago en el sistema...</span>
                  </div>
                </div>
              )}
              
              {paymentCreated && (
                <div className="alert alert-success mb-4">
                  <i className="bi bi-check-circle me-2"></i>
                  El pago ha sido registrado exitosamente en el sistema.
                </div>
              )}

              {/* Información del pago */}
              <div className="mb-4">
                <h5 className="mb-3">Información del Pago</h5>
                
                {paymentInfo.ref_payco && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-key me-2"></i>
                      Referencia de Pago
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        value={paymentInfo.ref_payco}
                        readOnly
                      />
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          navigator.clipboard.writeText(paymentInfo.ref_payco);
                          alert('Referencia copiada al portapapeles');
                        }}
                        title="Copiar referencia"
                      >
                        <i className="bi bi-clipboard"></i>
                      </button>
                    </div>
                  </div>
                )}

                {paymentInfo.estado && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-flag me-2"></i>
                      Estado
                    </label>
                    <div>
                      <span className={`badge bg-${statusStyle.color} fs-6 px-3 py-2`}>
                        {paymentInfo.estado}
                      </span>
                    </div>
                  </div>
                )}

                {paymentInfo.respuesta && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      <i className="bi bi-chat-left-text me-2"></i>
                      Mensaje
                    </label>
                    <div className={`alert alert-${statusStyle.color} mb-0`}>
                      {decodeURIComponent(paymentInfo.respuesta)}
                    </div>
                  </div>
                )}
              </div>

              {/* Mensaje informativo según el estado */}
              {paymentInfo.estado && (
                <div className={`alert alert-${statusStyle.color} mb-4`}>
                  <h6 className="alert-heading">
                    <i className={`bi ${statusStyle.icon} me-2`}></i>
                    {statusStyle.title}
                  </h6>
                  {statusStyle.color === 'success' && (
                    <p className="mb-0">
                      Tu pago ha sido procesado exitosamente. Puedes ver el detalle en tu sección de facturación.
                    </p>
                  )}
                  {statusStyle.color === 'warning' && (
                    <p className="mb-0">
                      Tu pago está siendo procesado. Por favor verifica el estado en tu sección de facturación en unos minutos.
                    </p>
                  )}
                  {statusStyle.color === 'danger' && (
                    <p className="mb-0">
                      El pago no pudo ser procesado. Por favor intenta nuevamente o contacta con soporte.
                    </p>
                  )}
                </div>
              )}

              {/* Botón para volver */}
              <div className="text-center">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleBack}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Volver a Facturación
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;

