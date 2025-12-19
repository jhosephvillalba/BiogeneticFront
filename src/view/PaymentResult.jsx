import React, { useEffect, useState } from 'react';
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
  const [registeringPayment, setRegisteringPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Registrar el pago inmediatamente cuando se carga la vista con los datos de ePayco
  useEffect(() => {
    const ref_payco = searchParams.get('ref_payco') || '';
    const estado = searchParams.get('estado') || '';
    const respuesta = searchParams.get('respuesta') || '';

    console.log('🔍 PaymentResult cargado con parámetros:', { ref_payco, estado, respuesta });
    console.log('🔍 URL completa:', window.location.href);
    console.log('🔍 localStorage disponible:', {
      pendingPaymentData: localStorage.getItem('pendingPaymentData'),
      pendingPaymentInvoiceId: localStorage.getItem('pendingPaymentInvoiceId')
    });

    setPaymentInfo({
      ref_payco,
      estado,
      respuesta
    });

    // Registrar el pago inmediatamente si tenemos ref_payco (ePayco ya procesó el pago)
    // SOLO usamos ref_payco y estado de ePayco, el resto de datos vienen de localStorage
    if (ref_payco && estado) {
      console.log('✅ Condiciones cumplidas, llamando a registerPayment...');
      registerPayment(ref_payco, estado);
    } else {
      console.warn('⚠️ No se puede registrar el pago:', {
        tieneRefPayco: !!ref_payco,
        tieneEstado: !!estado
      });
    }
  }, [searchParams]);

  // Función para registrar el pago en el sistema
  // Usa SOLO los datos guardados en localStorage + ref_payco y estado de ePayco
  const registerPayment = async (ref_payco, estado) => {
    try {
      setRegisteringPayment(true);

      // Obtener TODOS los datos de la factura desde localStorage (guardados antes de ir a ePayco)
      const savedPaymentData = localStorage.getItem('pendingPaymentData');
      
      if (!savedPaymentData) {
        console.error('❌ No se encontraron datos de la factura en localStorage');
        console.error('Datos disponibles en localStorage:', {
          pendingPaymentInvoiceId: localStorage.getItem('pendingPaymentInvoiceId'),
          pendingPaymentData: localStorage.getItem('pendingPaymentData')
        });
        return;
      }

      const invoiceData = JSON.parse(savedPaymentData);
      console.log('📋 Datos de la factura obtenidos de localStorage:', invoiceData);

      if (!invoiceData.factura_id) {
        console.error('❌ factura_id no encontrado en los datos guardados');
        return;
      }

      // Determinar el estado del pago según la respuesta de ePayco
      const estadoLower = estado.toLowerCase();
      let paymentStatus = 'pendiente';
      
      if (estadoLower === 'aceptada' || estadoLower === 'aprobado' || estadoLower === 'success') {
        paymentStatus = 'aprobado';
      } else if (estadoLower === 'rechazada' || estadoLower === 'fallida' || estadoLower === 'failed') {
        paymentStatus = 'rechazado';
      }

      // Preparar datos del pago usando SOLO los datos guardados + ref_payco y estado de ePayco
      const paymentData = {
        factura_id: parseInt(invoiceData.factura_id),
        ref_payco: ref_payco, // ✅ Este es el ÚNICO dato que viene de ePayco
        metodo_pago: 'epayco',
        monto: invoiceData.monto_pagar ? parseFloat(invoiceData.monto_pagar) : null, // ✅ De los datos guardados
        estado: paymentStatus, // ✅ Mapeado desde el estado de ePayco
        observaciones: `Pago procesado a través de ePayco. Referencia: ${ref_payco}. Estado: ${estado}. Factura: ${invoiceData.id_factura || invoiceData.factura_id}`
      };

      console.log('📤 Datos del pago a registrar:', paymentData);
      console.log('📤 Origen de los datos:', {
        factura_id: 'localStorage (guardado antes de ePayco)',
        ref_payco: 'ePayco (parámetro de URL)',
        metodo_pago: 'fijo: epayco',
        monto: 'localStorage (guardado antes de ePayco)',
        estado: 'ePayco (parámetro de URL, mapeado)',
        observaciones: 'generado'
      });

      // Verificar que api.payments existe
      if (!api.payments) {
        throw new Error('api.payments no está disponible');
      }

      if (!api.payments.createManualPayment) {
        throw new Error('api.payments.createManualPayment no está disponible');
      }

      console.log('🚀 Llamando a api.payments.createManualPayment con:', paymentData);
      
      // Registrar el pago
      const response = await api.payments.createManualPayment(paymentData);
      console.log('✅ Pago registrado exitosamente:', response);
      
      setPaymentSuccess(true);
      setPaymentError(null);
      
      // Limpiar los datos del localStorage
      localStorage.removeItem('pendingPaymentData');
      localStorage.removeItem('pendingPaymentInvoiceId'); // Por si acaso existe
      
    } catch (error) {
      console.error('❌ Error al registrar el pago:', error);
      console.error('Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Error desconocido al registrar el pago';
      
      setPaymentError(errorMessage);
      setPaymentSuccess(false);
    } finally {
      setRegisteringPayment(false);
    }
  };

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
              {/* Indicador de registro */}
              {registeringPayment && (
                <div className="alert alert-info mb-4">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    <span>Registrando el pago en el sistema...</span>
                  </div>
                </div>
              )}

              {/* Mensaje de éxito */}
              {paymentSuccess && (
                <div className="alert alert-success mb-4">
                  <i className="bi bi-check-circle me-2"></i>
                  <strong>¡Pago registrado exitosamente!</strong> El pago ha sido guardado en el sistema.
                </div>
              )}

              {/* Mensaje de error */}
              {paymentError && (
                <div className="alert alert-danger mb-4">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Error al registrar el pago:</strong> {paymentError}
                  <br />
                  <small className="text-muted">
                    Por favor contacta con soporte con la referencia: {paymentInfo.ref_payco}
                  </small>
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
