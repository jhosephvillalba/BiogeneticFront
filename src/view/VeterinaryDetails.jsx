import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersApi, rolesApi } from '../Api';

const VeterinaryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Estados
  const [veterinary, setVeterinary] = useState({
    full_name: '',
    email: '',
    number_document: '',
    phone: '',
    type_document: 'identity_card',
    specialty: '',
    status: 'Active',
    password: '',
    confirmPassword: ''
  });

  const [availableRoles, setAvailableRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar datos del veterinario y roles disponibles
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Cargar datos del veterinario
        const userData = await usersApi.getUserById(id);
        setVeterinary({
          full_name: userData.full_name || '',
          email: userData.email || '',
          number_document: userData.number_document || '',
          phone: userData.phone || '',
          type_document: userData.type_document || 'identity_card',
          specialty: userData.specialty || '',
          status: userData.status || 'Active',
          password: '',
          confirmPassword: ''
        });

        // Establecer roles del usuario
        if (userData.roles && Array.isArray(userData.roles)) {
          setUserRoles(userData.roles);
        }

        // Cargar roles disponibles
        const roles = await rolesApi.getRoles();
        setAvailableRoles(roles);

      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError(error.response?.data?.detail || 'Error al cargar los datos del veterinario');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVeterinary(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar asignación de rol
  const handleAddRole = async () => {
    if (!selectedRole) return;
    
    try {
      await rolesApi.assignRole(id, selectedRole);
      setSuccessMessage("Rol asignado correctamente");
      
      // Recargar roles del usuario
      const userData = await usersApi.getUserById(id);
      if (userData.roles && Array.isArray(userData.roles)) {
        setUserRoles(userData.roles);
      }
      
      setSelectedRole('');
    } catch (error) {
      console.error("Error al asignar rol:", error);
      setError("No se pudo asignar el rol seleccionado");
    }
  };

  // Manejar eliminación de rol
  const handleRemoveRole = async (roleId) => {
    try {
      await rolesApi.removeRole(id, roleId);
      setSuccessMessage("Rol eliminado correctamente");
      
      // Recargar roles del usuario
      const userData = await usersApi.getUserById(id);
      if (userData.roles && Array.isArray(userData.roles)) {
        setUserRoles(userData.roles);
      }
    } catch (error) {
      console.error("Error al eliminar rol:", error);
      setError("No se pudo eliminar el rol seleccionado");
    }
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');

      // Validar contraseñas si se están modificando
      if (!isEditing && !veterinary.password) {
        setError("La contraseña es obligatoria para nuevos veterinarios");
        return;
      }

      if (veterinary.password && veterinary.password !== veterinary.confirmPassword) {
        setError("Las contraseñas no coinciden");
        return;
      }

      const userData = {
        ...veterinary,
        roles: [2] // ID para rol de veterinario por defecto
      };

      // Eliminar campos que no deben enviarse al API
      delete userData.confirmPassword;
      
      if (isEditing && !veterinary.password) {
        delete userData.password;
      }

      if (isEditing) {
        await usersApi.updateUser(id, userData);
        setSuccessMessage("Veterinario actualizado con éxito");
      } else {
        await usersApi.createUser(userData);
        setSuccessMessage("Veterinario creado con éxito");
        setTimeout(() => navigate('/users/veterinary'), 1500);
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.detail || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
      window.scrollTo(0, 0);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del veterinario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Formulario Principal */}
        <div className={`col-md-${isEditing ? '8' : '12'}`}>
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-person-vcard-fill me-2"></i>
                {isEditing ? 'Editar Veterinario' : 'Nuevo Veterinario'}
              </h5>
            </div>
            
            <div className="card-body">
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
              
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Nombre Completo*</label>
                    <input
                      type="text"
                      className="form-control"
                      name="full_name"
                      value={veterinary.full_name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Correo Electrónico*</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={veterinary.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tipo de Documento</label>
                    <select
                      className="form-select"
                      name="type_document"
                      value={veterinary.type_document}
                      onChange={handleChange}
                      required
                    >
                      <option value="identity_card">Cédula de Ciudadanía</option>
                      <option value="foreign_card">Cédula de Extranjería</option>
                      <option value="passport">Pasaporte</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Número de Documento</label>
                    <input
                      type="text"
                      className="form-control"
                      name="number_document"
                      value={veterinary.number_document}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Teléfono</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phone"
                      value={veterinary.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Especialidad</label>
                    <input
                      type="text"
                      className="form-control"
                      name="specialty"
                      value={veterinary.specialty}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Estado</label>
                  <select 
                    className="form-select"
                    name="status"
                    value={veterinary.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Active">Activo</option>
                    <option value="Inactive">Inactivo</option>
                  </select>
                </div>

                <hr className="my-4" />
                
                <h6 className="mb-3">
                  <i className="bi bi-shield-lock me-2"></i>
                  {isEditing ? 'Cambiar Contraseña' : 'Establecer Contraseña'}
                </h6>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Contraseña {!isEditing ? '*' : '(opcional)'}</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={veterinary.password}
                      onChange={handleChange}
                      required={!isEditing}
                      minLength={6}
                    />
                    <small className="text-muted">Mínimo 6 caracteres</small>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirmar Contraseña {!isEditing ? '*' : '(opcional)'}</label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      value={veterinary.confirmPassword}
                      onChange={handleChange}
                      required={!isEditing}
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => navigate('/users/veterinary')}
                    disabled={saving}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        {isEditing ? 'Guardar cambios' : 'Crear veterinario'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Panel de Roles - Solo visible en modo edición */}
        {isEditing && (
          <div className="col-md-4">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-white">
                <h5 className="mb-0">Roles del Veterinario</h5>
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
                  
                  {userRoles.length === 0 ? (
                    <p className="text-muted small">
                      <i className="bi bi-info-circle me-2"></i>
                      Este veterinario no tiene roles asignados
                    </p>
                  ) : (
                    <ul className="list-group">
                      {userRoles.map(role => (
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

export default VeterinaryDetails; 