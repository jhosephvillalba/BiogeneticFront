import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi, rolesApi } from '../Api';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNewClient, setIsNewClient] = useState(id === 'new');
  
  const [client, setClient] = useState({
    full_name: '',
    email: '',
    number_document: '',
    type_document: 'identity_card',
    phone: '',
    address: '',
    password: '',
    confirmPassword: '',
    specialty: 'Client',
  });
  
  const [availableRoles, setAvailableRoles] = useState([]);
  const [clientRoles, setClientRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [response, setResponse] = useState(null);

  // Cargar datos del cliente
  useEffect(() => {
    const fetchClientData = async () => {
      if (isNewClient) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userData = await usersApi.getUserById(id);
        
        setClient({
          full_name: userData.full_name || '',
          email: userData.email || '',
          number_document: userData.number_document || '',
          type_document: userData.type_document || 'identity_card',
          phone: userData.phone || '',
          address: userData.address || '',
          password: '',
          confirmPassword: '',
        });
        
        // Si tiene roles, los guardamos
        if (userData.roles && Array.isArray(userData.roles)) {
          setClientRoles(userData.roles);
        }
        
      } catch (err) {
        console.error("Error al cargar datos del cliente:", err);
        setError("No se pudieron cargar los datos del cliente");
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientData();
  }, [id]);
  
  // Cargar roles disponibles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // Usar el servicio de roles para obtener los roles disponibles
        const roles = await rolesApi.getRoles();
        console.log("Roles obtenidos:", roles);
        setAvailableRoles(roles);
      } catch (err) {
        console.error("Error al cargar roles:", err);
      }
    };
    
    fetchRoles();
  }, []);

  useEffect(() => {
    // Si todo va bien y estamos creando, redirigimos al detalle
    if (isNewClient && response && response.id) {
      setTimeout(() => {
        navigate(`/client/users/${response.id}`);
      }, 1500);
    }
  }, [isNewClient, response, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClient(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    setSuccessMessage('');
    
    // Validaciones básicas
    if (!client.full_name || !client.email) {
      setError("El nombre y correo son obligatorios");
      setSaveLoading(false);
      return;
    }
    
    // Si es nuevo cliente o si se está cambiando contraseña, validar
    if (isNewClient || client.password) {
      if (client.password !== client.confirmPassword) {
        setError("Las contraseñas no coinciden");
        setSaveLoading(false);
        return;
      }
      
      if (isNewClient && !client.password) {
        setError("La contraseña es obligatoria para nuevos clientes");
        setSaveLoading(false);
        return;
      }
    }
    
    try {
      let response;
      
      if (isNewClient) {
        // Preparar datos según estructura del API
        const userData = {
          full_name: client.full_name,
          email: client.email,
          number_document: client.number_document,
          type_document: client.type_document,
          phone: client.phone,
          address: client.address,
          password: client.password,
          specialty: client.specialty,
          roles: [3] // Asumimos que el ID 3 es para clientes
        };
        
        // Crear nuevo cliente
        response = await usersApi.createUserWithRoles(userData);
        setSuccessMessage("Cliente creado con éxito");
      } else {
        // Actualizar cliente existente
        const updateData = { 
          full_name: client.full_name,
          email: client.email,
          number_document: client.number_document,
          type_document: client.type_document,
          phone: client.phone,
          address: client.address,
        };
        
        // Solo enviamos password si se ha introducido uno nuevo
        if (client.password) {
          updateData.password = client.password;
        }
        
        response = await usersApi.updateUser(id, updateData);
        setSuccessMessage("Cliente actualizado con éxito");
      }
      
      // Si todo va bien y estamos creando, redirigimos al detalle
      if (isNewClient && response && response.id) {
        setTimeout(() => {
          navigate(`/users/clients/${response.id}`);
        }, 1500);
      }
      
    } catch (err) {
      console.error("Error al guardar cliente:", err);
      setError(err.response?.data?.detail || "Error al guardar los datos del cliente");
    } finally {
      setSaveLoading(false);
      window.scrollTo(0, 0);
    }
  };
  
  const handleAddRole = async () => {
    if (!selectedRole) return;
    
    try {
      // Usar el servicio de roles para asignar un rol
      await rolesApi.assignRole(id, selectedRole);
      
      setSuccessMessage("Rol asignado correctamente");
      
      // Recargar roles del cliente
      const userData = await usersApi.getUserById(id);
      if (userData.roles && Array.isArray(userData.roles)) {
        setClientRoles(userData.roles);
      }
      
      setSelectedRole('');
      
    } catch (err) {
      console.error("Error al asignar rol:", err);
      setError("No se pudo asignar el rol seleccionado");
    }
  };
  
  const handleRemoveRole = async (roleId) => {
    try {
      // Usar el servicio de roles para quitar un rol
      await rolesApi.removeRole(id, roleId);
      
      setSuccessMessage("Rol eliminado correctamente");
      
      // Recargar roles del cliente
      const userData = await usersApi.getUserById(id);
      if (userData.roles && Array.isArray(userData.roles)) {
        setClientRoles(userData.roles);
      }
      
    } catch (err) {
      console.error("Error al eliminar rol:", err);
      setError("No se pudo eliminar el rol seleccionado");
    }
  };
  
  const handleBack = () => {
    navigate('/users/clients');
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del cliente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i className="bi bi-person-fill me-2"></i>
          {isNewClient ? 'Nuevo Cliente' : `Cliente: ${client.full_name}`}
        </h2>
        <button 
          className="btn btn-outline-secondary" 
          onClick={handleBack}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Volver
        </button>
      </div>
      
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      
      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle-fill me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
        </div>
      )}
      
      <div className="row">
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0">Información del Cliente</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSave}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombre Completo*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={client.full_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Correo Electrónico*</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={client.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Tipo de Documento</label>
                    <select
                      className="form-select"
                      name="type_document"
                      value={client.type_document}
                      onChange={handleInputChange}
                    >
                      <option value="identity_card">Cédula</option>
                      <option value="passport">Pasaporte</option>
                      <option value="other">Otro</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Número de Documento</label>
                    <input
                      type="text"
                      className="form-control"
                      name="number_document"
                      value={client.number_document}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={client.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Dirección</label>
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={client.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <hr className="my-4" />
                
                <h6 className="mb-3">
                  <i className="bi bi-shield-lock me-2"></i>
                  {isNewClient ? 'Establecer Contraseña' : 'Cambiar Contraseña'}
                </h6>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Contraseña {isNewClient ? '*' : ''}</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={client.password}
                      onChange={handleInputChange}
                      required={isNewClient}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirmar Contraseña {isNewClient ? '*' : ''}</label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      value={client.confirmPassword}
                      onChange={handleInputChange}
                      required={isNewClient}
                    />
                  </div>
                </div>
                
                <div className="d-flex justify-content-end mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-secondary me-2"
                    onClick={handleBack}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saveLoading}
                  >
                    {saveLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save me-2"></i>
                        Guardar Cliente
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {!isNewClient && (
          <div className="col-md-4">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white">
                <h5 className="mb-0">Roles del Cliente</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">Asignar Nuevo Rol</label>
                  <div className="input-group">
                    <select
                      className="form-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">Seleccione un rol...</option>
                      {availableRoles.map(role => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-outline-primary"
                      type="button"
                      onClick={handleAddRole}
                      disabled={!selectedRole}
                    >
                      <i className="bi bi-plus-lg"></i>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h6 className="mb-3">Roles Asignados</h6>
                  
                  {clientRoles.length === 0 ? (
                    <p className="text-muted small">
                      <i className="bi bi-info-circle me-2"></i>
                      Este cliente no tiene roles asignados
                    </p>
                  ) : (
                    <ul className="list-group">
                      {clientRoles.map(role => (
                        <li key={role.id} className="list-group-item d-flex justify-content-between align-items-center">
                          <span>
                            <i className="bi bi-shield-fill me-2"></i>
                            {role.name}
                          </span>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleRemoveRole(role.id)}
                            title="Eliminar rol"
                            type="button"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDetails; 