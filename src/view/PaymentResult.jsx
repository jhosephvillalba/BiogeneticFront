import React, { useEffect, useState, useRef } from 'react';
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
  const paymentRegisteredRef = useRef(false); // Flag para evitar múltiples registros

  // Registrar el pago inmediatamente cuando se carga la vista con los datos de ePayco
  useEffect(() => {
    // Evitar múltiples ejecuciones
    if (paymentRegisteredRef.current) {
      console.log('⏸️ Pago ya registrado, evitando ejecución duplicada');
      return;
    }

    // ePayco solo envía ref_payco en la URL de respuesta
    // Este es el valor que debemos usar como ref_payco en la base de datos
    const ref_payco = searchParams.get('ref_payco') || searchParams.get('x_ref_payco') || '';
    
    // ePayco puede enviar el estado con diferentes nombres: x_cod_response, x_response, estado
    const estado = searchParams.get('x_cod_response') || 
                   searchParams.get('x_response') || 
                   searchParams.get('estado') || '';
    
    // ePayco puede enviar la respuesta/mensaje con diferentes nombres: x_response_reason_text, respuesta, x_message
    const respuesta = searchParams.get('x_response_reason_text') || 
                      searchParams.get('respuesta') || 
                      searchParams.get('x_message') || '';
    
    const factura_id = searchParams.get('factura_id') || '';

    // Log de todos los parámetros de la URL para debugging
    console.log('🔍 PaymentResult cargado - Todos los parámetros de la URL:');
    const allParams = {};
    searchParams.forEach((value, key) => {
      allParams[key] = value;
    });
    console.log('🔍 Parámetros completos:', allParams);
    console.log('🔍 PaymentResult valores extraídos:', { 
      ref_payco, 
      estado, 
      respuesta, 
      factura_id 
    });
    console.log('🔍 URL completa:', window.location.href);
    console.log('🔍 Validación de condiciones:', {
      ref_payco: ref_payco,
      ref_payco_valido: !!ref_payco && ref_payco.length > 0,
      factura_id: factura_id,
      factura_id_valido: !!factura_id && factura_id.length > 0,
      condicion_cumplida: !!(ref_payco && factura_id)
    });

    // Guardar respuesta de ePayco en sessionStorage para que ClientBilling pueda leerla
    if (ref_payco) {
      try {
        const epaycoResponse = {
          ref_payco: ref_payco,
          x_cod_response: estado,
          x_response_reason_text: respuesta,
          factura_id: factura_id,
          timestamp: new Date().toISOString()
        };
        sessionStorage.setItem('epayco_response', JSON.stringify(epaycoResponse));
        
        // ============================================
        // 🧪 PRUEBA: Imprimir datos guardados
        // ============================================
        console.log('========================================');
        console.log('💾 PAYMENTRESULT: GUARDANDO RESPUESTA');
        console.log('========================================');
        console.log('📦 Datos guardados en sessionStorage:');
        console.log('🔑 ref_payco:', epaycoResponse.ref_payco);
        console.log('🔑 x_cod_response:', epaycoResponse.x_cod_response);
        console.log('🔑 x_response_reason_text:', epaycoResponse.x_response_reason_text);
        console.log('🔑 factura_id:', epaycoResponse.factura_id);
        console.log('🔑 timestamp:', epaycoResponse.timestamp);
        console.log('========================================');
      } catch (error) {
        console.error('❌ Error al guardar respuesta de ePayco:', error);
      }
    }

    setPaymentInfo({
      ref_payco,
      estado: estado || 'pendiente', // Si no viene estado, usar 'pendiente' por defecto
      respuesta
    });

    // Registrar el pago inmediatamente si tenemos ref_payco y factura_id (ePayco ya procesó el pago)
    // El estado no es necesario porque siempre será "pendiente" y el webhook lo actualizará
    if (ref_payco && ref_payco.trim() !== '' && factura_id && factura_id.trim() !== '') {
      console.log('✅ Condiciones cumplidas, registrando pago...');
      console.log('✅ Parámetros:', { 
        ref_payco, 
        factura_id, 
        estado: estado || 'pendiente (por defecto)' 
      });
      console.log('✅ IMPORTANTE: Usando ref_payco de la URL para registrar el pago');
      paymentRegisteredRef.current = true; // Marcar como registrado antes de llamar
      
      // Función para registrar el pago en el sistema
      // Obtiene los datos de la factura desde la API usando el factura_id de la URL
      const registerPayment = async () => {
        try {
          setRegisteringPayment(true);

          // Obtener factura_id de la URL
          const invoiceId = parseInt(factura_id);
          
          if (!invoiceId || isNaN(invoiceId)) {
            console.error('❌ factura_id inválido en la URL:', factura_id);
            setPaymentError('No se pudo identificar la factura. Por favor intenta nuevamente.');
            return;
          }

          console.log('📋 Obteniendo datos de la factura desde la API, factura_id:', invoiceId);
          
          // Obtener los datos de la factura desde la API
          const invoiceData = await api.billing.getInvoiceById(invoiceId);
          console.log('📋 Datos de la factura obtenidos de la API:', invoiceData);

          // Validar que tenemos los datos necesarios de la factura
          // La API puede devolver la factura directamente o dentro de un objeto
          const factura = invoiceData.factura || invoiceData;
          
          if (!factura || (!factura.id && !invoiceData.id)) {
            console.error('❌ No se pudieron obtener los datos de la factura desde la API');
            console.error('❌ Estructura de respuesta:', invoiceData);
            setPaymentError('No se pudieron obtener los datos de la factura. Por favor intenta nuevamente.');
            return;
          }

          // Usar factura si existe, sino usar invoiceData directamente
          const invoiceDataToUse = factura.id ? factura : invoiceData;
          console.log('📋 Datos de factura a usar:', invoiceDataToUse);

          // El estado siempre será "pendiente" porque el webhook de ePayco actualizará el estado más tarde
          const paymentStatus = 'pendiente';

          // Parsear monto correctamente (puede venir como string o número)
          let monto = null;
          if (invoiceDataToUse.monto_pagar !== undefined && invoiceDataToUse.monto_pagar !== null) {
            // Si es string, remover comas y convertir a número
            const montoStr = String(invoiceDataToUse.monto_pagar).replace(/,/g, '');
            monto = parseFloat(montoStr);
            if (isNaN(monto)) {
              console.warn('⚠️ No se pudo parsear monto_pagar, usando null');
              monto = null;
            }
          }

          // Preparar datos del pago usando los datos de la API + ref_payco
          // IMPORTANTE: Usamos ref_payco de la URL (ePayco lo envía en la respuesta)
          // El estado siempre será "pendiente" porque el webhook de ePayco lo actualizará
          const paymentData = {
            factura_id: invoiceId, // ✅ De la URL (ID de nuestra factura)
            ref_payco: ref_payco, // ✅ ref_payco de ePayco (viene en la URL de respuesta)
            metodo_pago: 'epayco',
            monto: monto, // ✅ De la API
            estado: paymentStatus, // ✅ Siempre "pendiente" (el webhook actualizará el estado)
            observaciones: `Pago procesado a través de ePayco. ref_payco: ${ref_payco}. Estado inicial: ${estado || 'pendiente'}. Factura: ${invoiceDataToUse.id_factura || invoiceDataToUse.id || invoiceId}`
          };

          console.log('📤 Datos del pago a registrar:', paymentData);
          console.log('📤 Validación de datos:', {
            factura_id: paymentData.factura_id,
            factura_id_valido: !isNaN(paymentData.factura_id) && paymentData.factura_id > 0,
            ref_payco: paymentData.ref_payco,
            ref_payco_valido: !!paymentData.ref_payco && paymentData.ref_payco.length > 0,
            monto: paymentData.monto,
            monto_valido: paymentData.monto === null || (!isNaN(paymentData.monto) && paymentData.monto > 0),
            estado: paymentData.estado,
            metodo_pago: paymentData.metodo_pago
          });

          // Validar datos antes de enviar
          if (!paymentData.factura_id || isNaN(paymentData.factura_id)) {
            throw new Error('factura_id inválido');
          }

          if (!paymentData.ref_payco || paymentData.ref_payco.trim() === '') {
            throw new Error('ref_payco es requerido');
          }

          // Verificar que api.payments existe
          if (!api.payments) {
            throw new Error('api.payments no está disponible');
          }

          if (!api.payments.createPayment) {
            throw new Error('api.payments.createPayment no está disponible');
          }

          console.log('🚀 Llamando a api.payments.createPayment...');
          console.log('🚀 Endpoint: POST /api/pagos');
          console.log('🚀 Payload completo:', JSON.stringify(paymentData, null, 2));
          
          // Registrar el pago usando el endpoint único
          const response = await api.payments.createPayment(paymentData);
          console.log('✅ Pago registrado exitosamente:', response);
          console.log('✅ Respuesta completa:', JSON.stringify(response, null, 2));
          
          setPaymentSuccess(true);
          setPaymentError(null);
          
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

      // Ejecutar la función inmediatamente
      registerPayment();
    } else {
      console.warn('⚠️ No se puede registrar el pago:', {
        tieneRefPayco: !!ref_payco,
        tieneFacturaId: !!factura_id,
        ref_payco,
        factura_id,
        estado: estado || '(no requerido)'
      });
    }
  }, [searchParams]);

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
