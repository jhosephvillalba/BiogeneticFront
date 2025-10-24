import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../Api/index.js';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados de pago
  const [paymentMethod, setPaymentMethod] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [availableBanks, setAvailableBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [paymentMethods, setPaymentMethods] = useState([]);
  
  // Estados del formulario de datos del cliente
  const [clientData, setClientData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    doc_type: 'CC',
    city: '',
    address: ''
  });
  const [editingClientData, setEditingClientData] = useState(true);
  const [savingClientData, setSavingClientData] = useState(false);
  
  // Estados del proceso de pago
  const [currentStep, setCurrentStep] = useState(1);
  const [pagoId, setPagoId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [bankSearchTerm, setBankSearchTerm] = useState('');

  // Cargar datos de la factura
  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Cargando factura para pago con ID:', id);
        
        // Verificar que api.billing.getInvoiceComplete existe
        if (!api.billing || !api.billing.getInvoiceComplete) {
          throw new Error('api.billing.getInvoiceComplete no está disponible');
        }
        
        const invoiceData = await api.billing.getInvoiceComplete(id);
        console.log('Datos de factura para pago recibidos:', invoiceData);
        
        setInvoice(invoiceData);
        
        // Cargar datos del cliente
        await loadClientData();
        
        // Cargar métodos de pago disponibles
        await loadPaymentMethods();
        
        // Cargar bancos PSE disponibles
        await loadAvailableBanks();
        
      } catch (error) {
        console.error('Error al cargar factura para pago:', error);
        setError(error.message || 'Error al cargar los datos de la factura');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadInvoice();
    }
  }, [id]);

  // Cargar datos del cliente
  const loadClientData = async () => {
    try {
      // Obtener datos del usuario actual
      const userData = await api.auth.getCurrentUser();
      console.log('Datos del usuario:', userData);
      
      setClientData({
        name: userData.full_name || userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        document: userData.number_document || '',
        doc_type: userData.type_document || 'CC',
        city: userData.city || 'Bogotá',
        address: userData.address || ''
      });
    } catch (error) {
      console.error('Error al cargar datos del cliente:', error);
      // Usar datos por defecto si falla
      setClientData({
        name: '',
        email: '',
        phone: '',
        document: '',
        doc_type: 'CC',
        city: 'Bogotá',
        address: ''
      });
    }
  };

  // Actualizar datos del cliente
  const updateClientData = async () => {
    try {
      setSavingClientData(true);
      console.log('Actualizando datos del cliente:', clientData);
      
      // Validar datos requeridos
      if (!clientData.name || !clientData.email) {
        alert('Por favor completa al menos el nombre y email');
        return;
      }
      
      // Aquí se implementaría la actualización del perfil del usuario
      // Por ahora solo mostramos un mensaje de éxito
      // TODO: Implementar llamada a API para actualizar perfil del usuario
      // await api.users.updateProfile(clientData);
      
      alert('Datos actualizados exitosamente');
      setEditingClientData(false);
      
    } catch (error) {
      console.error('Error al actualizar datos del cliente:', error);
      alert('Error al actualizar los datos: ' + (error.message || 'Error desconocido'));
    } finally {
      setSavingClientData(false);
    }
  };

  // Cargar métodos de pago disponibles
  const loadPaymentMethods = async () => {
    try {
      if (api.payments && api.payments.getAvailablePaymentMethods) {
        const methods = await api.payments.getAvailablePaymentMethods();
        setPaymentMethods(methods);
      }
    } catch (error) {
      console.error('Error al cargar métodos de pago:', error);
      // Usar métodos por defecto si falla
      setPaymentMethods([
        { id: 'epayco', name: 'ePayco (PSE)', icon: 'bi-credit-card' },
        //{ id: 'transferencia', name: 'Transferencia Bancaria', icon: 'bi-bank' },
        //{ id: 'efectivo', name: 'Pago en Efectivo', icon: 'bi-cash' },
        //{ id: 'cheque', name: 'Cheque', icon: 'bi-file-text' }
      ]);
    }
  };

  // Cargar bancos PSE disponibles
  const loadAvailableBanks = async () => {
    try {
      if (api.payments && api.payments.getPseBanks) {
        const response = await api.payments.getPseBanks();
        console.log('Respuesta de bancos PSE:', response);
        
        // Verificar si la respuesta tiene la estructura esperada
        if (response && response.success && response.banks) {
          setAvailableBanks(response.banks);
        } else if (Array.isArray(response)) {
          // Si la respuesta es directamente un array
          setAvailableBanks(response);
        } else {
          throw new Error('Formato de respuesta de bancos no válido');
        }
      }
    } catch (error) {
      console.error('Error al cargar bancos PSE:', error);
      // Usar lista estática si falla
      setAvailableBanks([
        { id: '1007', name: 'BANCO DE BOGOTÁ', code: '1007', description: 'Banco de Bogotá S.A.' },
        { id: '1013', name: 'BBVA COLOMBIA', code: '1013', description: 'BBVA Colombia S.A.' },
        { id: '1019', name: 'BANCO COLPATRIA', code: '1019', description: 'Banco Colpatria S.A.' },
        { id: '1023', name: 'BANCO DAVIVIENDA', code: '1023', description: 'Banco Davivienda S.A.' },
        { id: '1032', name: 'BANCO POPULAR', code: '1032', description: 'Banco Popular S.A.' }
      ]);
    }
  };

  const handleBack = () => {
    navigate('/client-billing');
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === 'epayco') {
      setCurrentStep(2); // Ir al paso de selección de banco
    } else {
      setCurrentStep(3); // Ir al paso de datos del cliente
    }
  };

  const handleBankSelect = (bank) => {
    setSelectedBank(bank.id);
    setCurrentStep(3); // Ir al paso de datos del cliente
  };

  const handleClientDataChange = (field, value) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Filtrar bancos por término de búsqueda
  const filteredBanks = availableBanks.filter(bank => 
    bank.name.toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
    bank.description?.toLowerCase().includes(bankSearchTerm.toLowerCase()) ||
    bank.code?.includes(bankSearchTerm)
  );

  const handleProcessPayment = async () => {
    try {
      if (!paymentMethod) {
        alert('Por favor selecciona un método de pago');
        return;
      }

      setProcessingPayment(true);
      console.log('Procesando pago con método:', paymentMethod);
      
      // Verificar que api.payments existe
      if (!api.payments) {
        throw new Error('api.payments no está disponible');
      }

      if (paymentMethod === 'epayco') {
        // Validar que se haya seleccionado un banco
        if (!selectedBank) {
          alert('Por favor selecciona un banco para continuar con el pago PSE');
          return;
        }
        
        // Validar datos del cliente
        if (!clientData.city || !clientData.address) {
          alert('Por favor completa la ciudad y dirección para continuar con el pago');
          setCurrentStep(2); // Ir al paso de datos del cliente
          return;
        }
        
        // Procesar pago con ePayco/PSE
        const paymentData = {
          factura_id: parseInt(id),
          city: clientData.city,
          address: clientData.address,
          bank_id: selectedBank
        };
        
        console.log('Creando pago PSE:', paymentData);
        const pseResponse = await api.payments.createPsePayment(paymentData);
        console.log('Respuesta PSE:', pseResponse);
        
        // Guardar ID del pago para monitoreo
        if (pseResponse.pago_id) {
          setPagoId(pseResponse.pago_id);
          setCurrentStep(4); // Ir al paso de confirmación
        }
        
        // Redirigir al banco
        if (pseResponse.bank_url) {
          window.location.href = pseResponse.bank_url;
        } else {
          alert('Error: No se recibió URL de redirección del banco');
        }
        
      } else {
        // Procesar pago manual (transferencia, efectivo, cheque)
        const paymentData = {
          factura_id: parseInt(id),
          metodo_pago: paymentMethod,
          monto: invoice.factura?.monto_total || 0,
          observaciones: `Pago ${paymentMethod} - Factura ${invoice.factura?.id_factura}`
        };
        
        console.log('Creando pago manual:', paymentData);
        const manualResponse = await api.payments.createManualPayment(paymentData);
        console.log('Pago manual creado:', manualResponse);
        
        alert(`Pago ${paymentMethod} registrado exitosamente. Se procesará manualmente.`);
        navigate('/client-billing');
      }
      
    } catch (error) {
      console.error('Error al procesar pago:', error);
      alert('Error al procesar el pago: ' + (error.message || 'Error desconocido'));
    } finally {
      setProcessingPayment(false);
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
                <i className="bi bi-credit-card me-2"></i>
                Procesar Pago
              </h2>
            </div>
            <div className="card">
              <div className="card-body">
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <p className="mt-3 text-muted">Cargando información de pago...</p>
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
                <i className="bi bi-credit-card me-2"></i>
                Procesar Pago
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
          <div className="d-flex align-items-center mb-4 mt-5">
            <button
              className="btn btn-outline-secondary me-3"
              onClick={handleBack}
              title="Volver a facturación"
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <h2 className="mb-0">
              <i className="bi bi-credit-card me-2"></i>
              Procesar Pago - Factura #{invoice?.factura?.id_factura || id}
            </h2>
          </div>

          {/* Contenido principal */}
          {invoice ? (
            <>
              {/* Indicador de Pasos */}
              <div className="row mb-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''}`}>
                          <span className="step-number">1</span>
                          <span className="step-label">Método de Pago</span>
                        </div>
                        <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''}`}>
                          <span className="step-number">2</span>
                          <span className="step-label">Banco</span>
                        </div>
                        <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''}`}>
                          <span className="step-number">3</span>
                          <span className="step-label">Datos</span>
                        </div>
                        <div className={`step-indicator ${currentStep >= 4 ? 'active' : ''}`}>
                          <span className="step-number">4</span>
                          <span className="step-label">Confirmar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 1: Selección de Método de Pago */}
              {currentStep === 1 && (
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-credit-card me-2"></i>
                          Seleccionar Método de Pago
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          {paymentMethods.length > 0 ? (
                            paymentMethods.map((method) => (
                              <div key={method.id} className="col-md-6 mb-3">
                                <div 
                                  className={`payment-method-card ${paymentMethod === method.id ? 'selected' : ''}`}
                                  onClick={() => handlePaymentMethodChange(method.id)}
                                >
                                  <i className={`bi ${method.icon || 'bi-credit-card'} me-2`}></i>
                                  {method.name}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-12">
                              <div className="text-center text-muted">
                                <i className="bi bi-hourglass-split me-2"></i>
                                Cargando métodos de pago...
                              </div>
                            </div>
                          )}
                        </div>
                        {paymentMethod && (
                          <div className="text-end mt-3">
                            <button className="btn btn-primary" onClick={nextStep}>
                              Continuar <i className="bi bi-arrow-right ms-2"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 2: Selección de Banco (solo para PSE) */}
              {currentStep === 2 && paymentMethod === 'epayco' && (
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <div className="d-flex justify-content-between align-items-center">
                          <h5 className="mb-0">
                            <i className="bi bi-bank me-2"></i>
                            Seleccionar Banco
                          </h5>
                          {availableBanks.length > 0 && (
                            <span className="badge bg-primary">
                              {availableBanks.length} bancos disponibles
                            </span>
                          )}
                        </div>
                        <p className="text-muted mb-0 mt-2">
                          Selecciona tu entidad bancaria para continuar con el pago PSE
                        </p>
                      </div>
                      <div className="card-body">
                        {/* Campo de búsqueda */}
                        {availableBanks.length > 0 && (
                          <div className="mb-4">
                            <div className="input-group">
                              <span className="input-group-text">
                                <i className="bi bi-search"></i>
                              </span>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar banco por nombre, descripción o código..."
                                value={bankSearchTerm}
                                onChange={(e) => setBankSearchTerm(e.target.value)}
                              />
                              {bankSearchTerm && (
                                <button
                                  className="btn btn-outline-secondary"
                                  type="button"
                                  onClick={() => setBankSearchTerm('')}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              )}
                            </div>
                            {bankSearchTerm && (
                              <small className="text-muted">
                                Mostrando {filteredBanks.length} de {availableBanks.length} bancos
                              </small>
                            )}
                          </div>
                        )}
                        
                        <div className="row">
                          {availableBanks.length > 0 ? (
                            (filteredBanks.length > 0 ? filteredBanks : availableBanks).map((bank) => (
                              <div key={bank.id} className="col-lg-4 col-md-6 mb-3">
                                <div 
                                  className={`bank-card ${selectedBank === bank.id ? 'selected' : ''}`}
                                  onClick={() => handleBankSelect(bank)}
                                  title={bank.description || bank.name}
                                >
                                  <div className="bank-icon">
                                    <i className="bi bi-bank"></i>
                                  </div>
                                  <div className="bank-info">
                                    <div className="bank-name">{bank.name}</div>
                                    {bank.description && (
                                      <div className="bank-description">{bank.description}</div>
                                    )}
                                    <div className="bank-code">Código: {bank.code || bank.id}</div>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-12">
                              <div className="text-center text-muted py-4">
                                <i className="bi bi-hourglass-split me-2"></i>
                                Cargando bancos disponibles...
                              </div>
                            </div>
                          )}
                          
                          {/* Mensaje cuando no se encuentran bancos en la búsqueda */}
                          {availableBanks.length > 0 && filteredBanks.length === 0 && bankSearchTerm && (
                            <div className="col-12">
                              <div className="text-center text-muted py-4">
                                <i className="bi bi-search me-2"></i>
                                No se encontraron bancos que coincidan con "{bankSearchTerm}"
                                <br />
                                <button 
                                  className="btn btn-link btn-sm mt-2"
                                  onClick={() => setBankSearchTerm('')}
                                >
                                  Limpiar búsqueda
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        {selectedBank && (
                          <div className="alert alert-info mt-3" role="alert">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Banco seleccionado:</strong> {availableBanks.find(b => b.id === selectedBank)?.name}
                            <br />
                            <small>Serás redirigido a la página segura de tu banco para completar el pago.</small>
                          </div>
                        )}
                        
                        <div className="d-flex justify-content-between mt-3">
                          <button className="btn btn-outline-secondary" onClick={prevStep}>
                            <i className="bi bi-arrow-left me-2"></i> Anterior
                          </button>
                          {selectedBank && (
                            <button className="btn btn-primary" onClick={nextStep}>
                              Continuar <i className="bi bi-arrow-right ms-2"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 3: Datos del Cliente */}
              {currentStep === 3 && (
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="bi bi-person me-2"></i>
                          Datos del Pagador
                        </h5>
                        <button 
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => {
                            if (editingClientData) {
                              updateClientData();
                            } else {
                              setEditingClientData(true);
                            }
                          }}
                          disabled={savingClientData}
                        >
                          {savingClientData ? (
                            <>
                              <div className="spinner-border spinner-border-sm me-1" role="status">
                                <span className="visually-hidden">Guardando...</span>
                              </div>
                              Guardando...
                            </>
                          ) : (
                            <>
                              <i className={`bi ${editingClientData ? 'bi-check' : 'bi-pencil'} me-1`}></i>
                              {editingClientData ? 'Guardar Cambios' : 'Editar Datos'}
                            </>
                          )}
                        </button>
                      </div>
                      <div className="card-body">
                        {editingClientData && (
                          <div className="alert alert-info mb-3" role="alert">
                            <i className="bi bi-info-circle me-2"></i>
                            <strong>Puedes editar tus datos:</strong> Actualiza la información que necesites cambiar. 
                            Los campos marcados con * son obligatorios para completar el pago.
                          </div>
                        )}
                        
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Nombre Completo *</label>
                              <input
                                type="text"
                                className={`form-control ${!clientData.name && editingClientData ? 'is-invalid' : ''}`}
                                value={clientData.name}
                                onChange={(e) => handleClientDataChange('name', e.target.value)}
                                disabled={!editingClientData}
                                required
                              />
                              {!clientData.name && editingClientData && (
                                <div className="invalid-feedback">
                                  El nombre es requerido
                                </div>
                              )}
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Email *</label>
                              <input
                                type="email"
                                className={`form-control ${!clientData.email && editingClientData ? 'is-invalid' : ''}`}
                                value={clientData.email}
                                onChange={(e) => handleClientDataChange('email', e.target.value)}
                                disabled={!editingClientData}
                                required
                              />
                              {!clientData.email && editingClientData && (
                                <div className="invalid-feedback">
                                  El email es requerido
                                </div>
                              )}
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Teléfono</label>
                              <input
                                type="tel"
                                className="form-control"
                                value={clientData.phone}
                                onChange={(e) => handleClientDataChange('phone', e.target.value)}
                                disabled={!editingClientData}
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Tipo de Documento</label>
                              <select
                                className="form-select"
                                value={clientData.doc_type}
                                onChange={(e) => handleClientDataChange('doc_type', e.target.value)}
                                disabled={!editingClientData}
                              >
                                <option value="CC">Cédula de Ciudadanía</option>
                                <option value="CE">Cédula de Extranjería</option>
                                <option value="PP">Pasaporte</option>
                                <option value="NIT">NIT</option>
                              </select>
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Número de Documento</label>
                              <input
                                type="text"
                                className="form-control"
                                value={clientData.document}
                                onChange={(e) => handleClientDataChange('document', e.target.value)}
                                disabled={!editingClientData}
                              />
                            </div>
                            <div className="mb-3">
                              <label className="form-label">Ciudad *</label>
                              <input
                                type="text"
                                className={`form-control ${!clientData.city ? 'is-invalid' : ''}`}
                                value={clientData.city}
                                onChange={(e) => handleClientDataChange('city', e.target.value)}
                                required
                                placeholder="Ej: Bogotá"
                              />
                              {!clientData.city && (
                                <div className="invalid-feedback">
                                  La ciudad es requerida para el pago PSE
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-12">
                            <div className="mb-3">
                              <label className="form-label">Dirección *</label>
                              <textarea
                                className={`form-control ${!clientData.address ? 'is-invalid' : ''}`}
                                rows="3"
                                value={clientData.address}
                                onChange={(e) => handleClientDataChange('address', e.target.value)}
                                required
                                placeholder="Ej: Calle 123 #45-67"
                              />
                              {!clientData.address && (
                                <div className="invalid-feedback">
                                  La dirección es requerida para el pago PSE
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between mt-3">
                          <button className="btn btn-outline-secondary" onClick={prevStep}>
                            <i className="bi bi-arrow-left me-2"></i> Anterior
                          </button>
                          <button 
                            className="btn btn-primary" 
                            onClick={nextStep}
                            disabled={!clientData.city || !clientData.address}
                          >
                            Continuar <i className="bi bi-arrow-right ms-2"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Paso 4: Confirmación */}
              {currentStep === 4 && (
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">
                          <i className="bi bi-check-circle me-2"></i>
                          Confirmar Pago
                        </h5>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-6">
                            <h6>Resumen de la Factura</h6>
                            <p><strong>Número:</strong> {invoice.factura?.id_factura}</p>
                            <p><strong>Total:</strong> ${invoice.factura?.monto_total?.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                            <p><strong>Vencimiento:</strong> {invoice.factura?.fecha_vencimiento ? new Date(invoice.factura.fecha_vencimiento).toLocaleDateString('es-ES') : 'Sin vencimiento'}</p>
                          </div>
                          <div className="col-md-6">
                            <h6>Datos del Pago</h6>
                            <p><strong>Método:</strong> {paymentMethod === 'epayco' ? 'PSE (Pagos Seguros en Línea)' : paymentMethod}</p>
                            {paymentMethod === 'epayco' && selectedBank && (
                              <p><strong>Banco:</strong> {availableBanks.find(b => b.id === selectedBank)?.name}</p>
                            )}
                            <p><strong>Pagador:</strong> {clientData.name}</p>
                            <p><strong>Ciudad:</strong> {clientData.city}</p>
                          </div>
                        </div>
                        <div className="d-flex justify-content-between mt-4">
                          <button className="btn btn-outline-secondary" onClick={prevStep}>
                            <i className="bi bi-arrow-left me-2"></i> Anterior
                          </button>
                          <button 
                            className="btn btn-success btn-lg"
                            onClick={handleProcessPayment}
                            disabled={processingPayment}
                          >
                            {processingPayment ? (
                              <>
                                <div className="spinner-border spinner-border-sm me-2" role="status">
                                  <span className="visually-hidden">Procesando...</span>
                                </div>
                                Procesando...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-credit-card me-2"></i>
                                Confirmar y Pagar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

export default Payment;
