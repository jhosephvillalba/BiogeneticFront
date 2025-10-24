import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../Api/index.js';

const CreateBilling = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const client = location.state?.client;

  // Estados para los items de facturación
  const [invoiceItems, setInvoiceItems] = useState({
    embrioFresco: '',
    embrioCongelado: '',
    materialCampo: '',
    nitrogeno: '',
    mensajeria: '',
    pajillaSemen: '',
    fundasTE: ''
  });

  const [subtotal, setSubtotal] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [includeIva, setIncludeIva] = useState(true);
  const [ivaPercentage, setIvaPercentage] = useState(19);
  const [description, setDescription] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30); // 30 días desde hoy
    return fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD para input
  });

  // Calcular totales cuando cambien los items
  useEffect(() => {
    const subtotalValue = Object.values(invoiceItems).reduce((sum, value) => {
      // Convertir string de moneda a número
      const numericValue = parseFloat(value.replace(/[^\d]/g, '')) || 0;
      return sum + numericValue;
    }, 0);
    
    const ivaValue = includeIva ? (subtotalValue * ivaPercentage / 100) : 0;
    const totalValue = subtotalValue + ivaValue;

    setSubtotal(subtotalValue);
    setIva(ivaValue);
    setTotal(totalValue);
  }, [invoiceItems, includeIva, ivaPercentage]);

  const handleBack = () => {
    navigate('/billing');
  };

  const handleItemChange = (itemName, value) => {
    // Formatear el valor como moneda mientras el usuario escribe
    const formattedValue = formatCurrencyInput(value);
    setInvoiceItems(prev => ({
      ...prev,
      [itemName]: formattedValue
    }));
  };

  const formatCurrencyInput = (value) => {
    // Remover todo excepto números
    const numericValue = value.replace(/[^\d]/g, '');
    
    if (numericValue === '') return '';
    
    // Formatear como moneda colombiana
    const number = parseInt(numericValue);
    return new Intl.NumberFormat('es-CO').format(number);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Función helper para convertir valores de moneda a número
      const parseCurrencyValue = (value) => {
        if (!value || value === '') return 0;
        const numericValue = value.replace(/[^\d]/g, '');
        const parsed = parseFloat(numericValue);
        return isNaN(parsed) ? 0 : parsed;
      };

      // Preparar datos para el endpoint from-form según la estructura esperada
      const items = [
        { nombre: "Embrión Fresco", valor: parseCurrencyValue(invoiceItems.embrioFresco) },
        { nombre: "Embrión Congelado", valor: parseCurrencyValue(invoiceItems.embrioCongelado) },
        { nombre: "Material de Campo", valor: parseCurrencyValue(invoiceItems.materialCampo) },
        { nombre: "Nitrógeno", valor: parseCurrencyValue(invoiceItems.nitrogeno) },
        { nombre: "Mensajería", valor: parseCurrencyValue(invoiceItems.mensajeria) },
        { nombre: "Pajilla de Semen", valor: parseCurrencyValue(invoiceItems.pajillaSemen) },
        { nombre: "Fundas T.E", valor: parseCurrencyValue(invoiceItems.fundasTE) }
      ].filter(item => item.valor > 0); // Solo incluir items con valor > 0

      const montoBase = items.reduce((sum, item) => sum + item.valor, 0);
      const valorIva = includeIva ? (montoBase * ivaPercentage / 100) : 0;
      const montoPagar = montoBase + valorIva;

      const formData = {
        monto_pagar: montoPagar,
        monto_base: montoBase,
        iva: includeIva ? ivaPercentage : 0,
        valor_iva: valorIva,
        descripcion: description,
        fecha_vencimiento: new Date(fechaVencimiento + 'T23:59:59.999Z').toISOString(), // Fecha seleccionada por el usuario
        cliente_id: client?.id,
        items: items,
        aplica_iva: includeIva
      };

      // Validar que haya un cliente seleccionado
      if (!client?.id) {
        alert('No se ha seleccionado un cliente. Por favor, regrese a la vista de facturación y seleccione un cliente.');
        setLoading(false);
        return;
      }

      // Validar que al menos un item tenga valor mayor a 0
      if (items.length === 0) {
        alert('Debe ingresar al menos un item con valor mayor a 0');
        setLoading(false);
        return;
      }

      console.log('Valores originales de invoiceItems:', invoiceItems);
      console.log('Items procesados:', items);
      console.log('Cálculos:', {
        montoBase: montoBase,
        valorIva: valorIva,
        montoPagar: montoPagar,
        ivaPercentage: ivaPercentage,
        includeIva: includeIva
      });
      console.log('Fecha de vencimiento seleccionada:', fechaVencimiento);
      console.log('Fecha de vencimiento en formato ISO:', new Date(fechaVencimiento + 'T23:59:59.999Z').toISOString());
      console.log('Total de items con valor > 0:', items.length);
      console.log('Enviando datos de la factura:', formData);

      // Enviar a la API real
      const response = await api.billing.createInvoiceFromForm(formData);
      
      console.log('Respuesta exitosa del servidor:', response);
      alert('Factura creada exitosamente');
      navigate('/billing');
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message;
      alert('Error al crear la factura: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setInvoiceItems({
      embrioFresco: '',
      embrioCongelado: '',
      materialCampo: '',
      nitrogeno: '',
      mensajeria: '',
      pajillaSemen: '',
      fundasTE: ''
    });
    setIncludeIva(true);
    setIvaPercentage(19);
    setDescription('');
    // Resetear fecha de vencimiento a 30 días desde hoy
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 30);
    setFechaVencimiento(fecha.toISOString().split('T')[0]);
  };

  const handleIvaToggle = () => {
    setIncludeIva(!includeIva);
  };

  const handleIvaPercentageChange = (value) => {
    const numericValue = parseFloat(value) || 0;
    setIvaPercentage(Math.min(Math.max(numericValue, 0), 100)); // Limitar entre 0 y 100
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12 mt-4">
          {/* Header con botón de regreso */}
          <div className="d-flex align-items-center mb-4">
            <button
              className="btn btn-outline-secondary me-3"
              onClick={handleBack}
              title="Volver a facturación"
            >
              <i className="bi bi-arrow-left"></i>
            </button>
            <h2 className="mb-0">
              <i className="bi bi-plus-circle me-2"></i>
              Crear Factura
            </h2>
          </div>

          {/* Información del cliente si está disponible */}
          {client && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>
                  Cliente Seleccionado
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Nombre:</strong> {client.name}</p>
                    <p><strong>Email:</strong> {client.email}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Teléfono:</strong> {client.phone || 'No disponible'}</p>
                    <p><strong>Dirección:</strong> {client.address || 'No disponible'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulario de Creación de Factura */}
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* Formulario de Items */}
              <div className="col-lg-8">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-list-ul me-2"></i>
                      Items de Facturación
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      {/* Embrión Fresco */}
                      <div className="col-md-6 mb-3">
                        <label htmlFor="embrioFresco" className="form-label">
                          <i className="bi bi-droplet me-1"></i>
                          Embrión Fresco
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="text"
                            className="form-control"
                            id="embrioFresco"
                            value={invoiceItems.embrioFresco}
                            onChange={(e) => handleItemChange('embrioFresco', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Embrión Congelado */}
                      <div className="col-md-6 mb-3">
                        <label htmlFor="embrioCongelado" className="form-label">
                          <i className="bi bi-snow me-1"></i>
                          Embrión Congelado
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="text"
                            className="form-control"
                            id="embrioCongelado"
                            value={invoiceItems.embrioCongelado}
                            onChange={(e) => handleItemChange('embrioCongelado', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Material de Campo */}
                      <div className="col-md-6 mb-3">
                        <label htmlFor="materialCampo" className="form-label">
                          <i className="bi bi-tools me-1"></i>
                          Material de Campo
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="text"
                            className="form-control"
                            id="materialCampo"
                            value={invoiceItems.materialCampo}
                            onChange={(e) => handleItemChange('materialCampo', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Nitrógeno */}
                      <div className="col-md-6 mb-3">
                        <label htmlFor="nitrogeno" className="form-label">
                          <i className="bi bi-thermometer me-1"></i>
                          Nitrógeno
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="text"
                            className="form-control"
                            id="nitrogeno"
                            value={invoiceItems.nitrogeno}
                            onChange={(e) => handleItemChange('nitrogeno', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Mensajería */}
                      <div className="col-md-6 mb-3">
                        <label htmlFor="mensajeria" className="form-label">
                          <i className="bi bi-truck me-1"></i>
                          Mensajería
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="text"
                            className="form-control"
                            id="mensajeria"
                            value={invoiceItems.mensajeria}
                            onChange={(e) => handleItemChange('mensajeria', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Pajilla de Semen */}
                      <div className="col-md-6 mb-3">
                        <label htmlFor="pajillaSemen" className="form-label">
                          <i className="bi bi-droplet-fill me-1"></i>
                          Pajilla de Semen
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="text"
                            className="form-control"
                            id="pajillaSemen"
                            value={invoiceItems.pajillaSemen}
                            onChange={(e) => handleItemChange('pajillaSemen', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      {/* Fundas T.E */}
                      <div className="col-md-6 mb-3">
                        <label htmlFor="fundasTE" className="form-label">
                          <i className="bi bi-bag me-1"></i>
                          Fundas T.E
                        </label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input
                            type="text"
                            className="form-control"
                            id="fundasTE"
                            value={invoiceItems.fundasTE}
                            onChange={(e) => handleItemChange('fundasTE', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campo de Descripción */}
                <div className="card mt-4">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-file-text me-2"></i>
                      Descripción de la Factura
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">
                        Descripción (Opcional)
                      </label>
                      <textarea
                        className="form-control"
                        id="description"
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ingrese una descripción detallada de los servicios facturados..."
                        maxLength="500"
                      />
                      <div className="form-text">
                        <i className="bi bi-info-circle me-1"></i>
                        Máximo 500 caracteres. {description.length}/500
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de Totales */}
              <div className="col-lg-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-calculator me-2"></i>
                      Resumen de Factura
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Subtotal:</span>
                      <strong>{formatCurrency(subtotal)}</strong>
                    </div>
                    
                    {/* Campo de Fecha de Vencimiento */}
                    <div className="mb-3 p-3 bg-light rounded">
                      <label htmlFor="fechaVencimiento" className="form-label fw-bold">
                        <i className="bi bi-calendar-event me-1"></i>
                        Fecha de Vencimiento:
                      </label>
                      <input
                        type="date"
                        className="form-control"
                        id="fechaVencimiento"
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                        min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                      />
                      <div className="form-text">
                        <i className="bi bi-info-circle me-1"></i>
                        La factura vencerá el {new Date(fechaVencimiento + 'T23:59:59.999Z').toLocaleDateString('es-CO')}
                      </div>
                    </div>
                    
                    {/* Controles de IVA */}
                    <div className="mb-3 p-3 bg-light rounded">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="fw-bold">IVA:</span>
                        <div className="form-check form-switch">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="includeIva"
                            checked={includeIva}
                            onChange={handleIvaToggle}
                          />
                          <label className="form-check-label" htmlFor="includeIva">
                            {includeIva ? 'Incluir' : 'Excluir'}
                          </label>
                        </div>
                      </div>
                      
                      {includeIva && (
                        <div className="row">
                          <div className="col-8">
                            <label htmlFor="ivaPercentage" className="form-label small">
                              Porcentaje de IVA:
                            </label>
                            <div className="input-group input-group-sm">
                              <input
                                type="number"
                                className="form-control"
                                id="ivaPercentage"
                                value={ivaPercentage}
                                onChange={(e) => handleIvaPercentageChange(e.target.value)}
                                min="0"
                                max="100"
                                step="0.1"
                              />
                              <span className="input-group-text">%</span>
                            </div>
                          </div>
                          <div className="col-4 d-flex align-items-end">
                            <div className="text-end w-100">
                              <small className="text-muted">Valor:</small>
                              <div className="fw-bold">{formatCurrency(iva)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <hr />
                    <div className="d-flex justify-content-between mb-3">
                      <span className="h5">Total:</span>
                      <strong className="h5 text-primary">{formatCurrency(total)}</strong>
                    </div>

                    {/* Botones de Acción */}
                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || total === 0}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creando...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle me-2"></i>
                            Crear Factura
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetForm}
                        disabled={loading}
                      >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Limpiar Formulario
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleBack}
                        disabled={loading}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Información Adicional */}
                <div className="card mt-3">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="bi bi-info-circle me-2"></i>
                      Información
                    </h6>
                    <p className="card-text small text-muted">
                      Los valores se calculan automáticamente. El IVA es opcional y configurable.
                    </p>
                    <p className="card-text small text-muted">
                      Todos los campos son opcionales y pueden dejarse vacíos.
                    </p>
                    <p className="card-text small text-muted">
                      El porcentaje de IVA se puede ajustar entre 0% y 100%.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBilling;
