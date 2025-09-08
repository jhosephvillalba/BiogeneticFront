import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usersApi } from "../Api";
import { authApi } from "../Api";

const ProfileView = ({ updateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    specialty: "",
    type_document: "",
    number_document: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [userLoaded, setUserLoaded] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Intentar cargar desde localStorage
        const userDataStr = localStorage.getItem('userData');
        
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          setProfile({
            name: userData.full_name || userData.name || "",
            email: userData.email || "",
            phone: userData.phone || "",
            specialty: userData.specialty || "",
            type_document: userData.type_document || "",
            number_document: userData.number_document || "",
            address: userData.address || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
          });
          
          if (userData.profile_image_url) {
            setProfilePhoto(userData.profile_image_url);
          } else {
            setProfilePhoto(null);
          }
          
          setUserLoaded(true);
        } else {
          // Si no hay datos en localStorage, intentar obtenerlos del servidor
          try {
            const freshUserData = await authApi.getCurrentUser();
            
            // Actualizar estado y localStorage
            const userInfo = {
              ...freshUserData,
              name: freshUserData.full_name || "Usuario",
            };
            
            localStorage.setItem('userData', JSON.stringify(userInfo));
            
            setProfile({
              name: userInfo.full_name || userInfo.name || "",
              email: userInfo.email || "",
              phone: userInfo.phone || "",
              specialty: userInfo.specialty || "",
              type_document: userInfo.type_document || "",
              number_document: userInfo.number_document || "",
              address: userInfo.address || "",
              currentPassword: "",
              newPassword: "",
              confirmPassword: ""
            });
            
            setProfilePhoto(userInfo.profile_image_url || null);
            setUserLoaded(true);
          } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
            setMessage({
              type: "danger",
              text: "No se pudieron cargar tus datos. Por favor, inténtalo de nuevo más tarde."
            });
          }
        }
      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
        setMessage({
          type: "danger",
          text: "Error al cargar datos del perfil"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Obtener el ID del usuario desde localStorage
      const userData = JSON.parse(localStorage.getItem('userData'));
      
      // Verificar si queremos actualizar también la contraseña
      const updateData = {
        full_name: profile.name,
        email: profile.email,
        phone: profile.phone,
        specialty: profile.specialty,
        type_document: profile.type_document,
        number_document: profile.number_document,
        address: profile.address
      };
      
      if (profile.newPassword && profile.currentPassword) {
        if (profile.newPassword !== profile.confirmPassword) {
          setMessage({ 
            type: "danger", 
            text: "Las contraseñas nuevas no coinciden"
          });
          setSaving(false);
          return;
        }
        
        if (profile.newPassword.length < 6) {
          setMessage({
            type: "danger",
            text: "La nueva contraseña debe tener al menos 6 caracteres"
          });
          setSaving(false);
          return;
        }
        
        updateData.current_password = profile.currentPassword;
        updateData.new_password = profile.newPassword;
      }
      
      // Crear el objeto actualizado con todos los datos del usuario
      const newUserData = {
        ...userData,
        ...updateData,
        name: profile.name,
        photo: profilePhoto,
      };
      
      // Simular llamada al API (reemplazar con tu llamada real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar el estado global usando la función recibida como prop
      updateUser(newUserData);
      
      setMessage({ 
        type: "success", 
        text: "¡Perfil actualizado correctamente!" 
      });
      
      setIsEditing(false);
      
      // Restablecer campos de contraseña
      setProfile(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
      
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      setMessage({ 
        type: "danger", 
        text: "No se pudo actualizar el perfil. Por favor, intente nuevamente." 
      });
    } finally {
      setSaving(false);
      window.scrollTo(0, 0);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: "warning",
          text: "La imagen no debe superar los 5MB"
        });
        return;
      }
      try {
        // Subir la imagen al backend
        const response = await usersApi.uploadProfilePicture(file);
        if (response && response.url) {
          setProfilePhoto(response.url);
          setProfile(prev => ({
            ...prev,
            profile_image_url: response.url
          }));
          // Actualizar la url en localStorage
          const userData = JSON.parse(localStorage.getItem('userData'));
          if (userData) {
            userData.profile_image_url = response.url;
            localStorage.setItem('userData', JSON.stringify(userData));
            // Actualizar en la base de datos
            if (usersApi.updateUser) {
              try {
                await usersApi.updateUser(userData.id, { profile_image_url: response.url });
              } catch (err) {
                setMessage({
                  type: "danger",
                  text: "La imagen se subió pero no se pudo actualizar en la base de datos."
                });
                setIsEditingPhoto(false);
                return;
              }
            }
            // Actualizar el estado global
            updateUser(userData);
          }
          setMessage({
            type: "success",
            text: "Foto de perfil actualizada correctamente"
          });
        } else {
          setMessage({
            type: "danger",
            text: "No se pudo actualizar la foto de perfil."
          });
        }
      } catch (error) {
        setMessage({
          type: "danger",
          text: "Error al subir la foto de perfil."
        });
      }
    }
    setIsEditingPhoto(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 profile-view">
      {message.text && (
        <div className={`alert alert-${message.type} alert-dismissible fade show mb-4`} role="alert">
          <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2`}></i>
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: "", text: "" })} aria-label="Close"></button>
        </div>
      )}
      
      <div className="row">
        {/* Columna izquierda - Foto de perfil */}
        <div className="col-md-4">
          <div className="card profile-card shadow-sm mb-4">
            <div className="card-body text-center">
              <div className="profile-photo-container position-relative mb-4">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    className="rounded-circle border border-3 border-primary"
                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    alt="Foto de perfil"
                  />
                ) : (
                  <span className="placeholder rounded-circle d-inline-block bg-secondary" style={{ width: "150px", height: "150px", lineHeight: "150px", textAlign: "center", fontSize: "3rem", color: "#fff" }}>
                    <i className="bi bi-person" />
                  </span>
                )}
                {isEditing && (
                  <button
                    className="btn btn-sm btn-primary rounded-circle position-absolute"
                    style={{ bottom: "10px", right: "10px" }}
                    onClick={() => setIsEditingPhoto(!isEditingPhoto)}
                    title="Cambiar foto"
                  >
                    <i className="bi bi-camera-fill"></i>
                  </button>
                )}
              </div>
              
              {isEditingPhoto ? (
                <div className="mb-3">
                  <div className="alert alert-info small mb-2">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    Selecciona una nueva imagen de perfil (máx. 5MB)
                  </div>
                  <input
                    type="file"
                    className="form-control form-control-sm"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <div className="d-flex justify-content-center mt-2">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setIsEditingPhoto(false)}
                    >
                      <i className="bi bi-x-circle me-1"></i>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h5 className="mb-2">{profile.name}</h5>
                  {profile.specialty && (
                    <div className="badge bg-primary-light text-primary rounded-pill p-2 mb-2">
                      <i className="bi bi-shield-check me-1"></i>
                      {profile.specialty}
                    </div>
                  )}
                  {profile.email && (
                    <div className="text-muted small mb-2">
                      <i className="bi bi-envelope me-1"></i>
                      {profile.email}
                    </div>
                  )}
                  {profile.phone && (
                    <div className="text-muted small">
                      <i className="bi bi-telephone me-1"></i>
                      {profile.phone}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha - Información del perfil */}
        <div className="col-md-8">
          <div className="card shadow-sm profile-info-card">
            <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
              <h5 className="mb-0">
                <i className="bi bi-person-circle me-2"></i>
                Información del Perfil
              </h5>
              {!isEditing ? (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="bi bi-pencil-square me-1"></i>
                  Editar Perfil
                </button>
              ) : (
                <span className="badge bg-primary">Modo Edición</span>
              )}
            </div>
            
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-person me-1"></i>
                      Nombre Completo
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={profile.name}
                        onChange={handleInputChange}
                        required
                      />
                    ) : (
                      <p className="form-control-plaintext">
                        {profile.name}
                      </p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-briefcase me-1"></i>
                      Especialidad
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="specialty"
                        value={profile.specialty}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <p className="form-control-plaintext">
                        {profile.specialty || "No especificada"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-envelope me-1"></i>
                      Correo Electrónico
                    </label>
                    <p className="form-control-plaintext">
                      {profile.email}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-telephone me-1"></i>
                      Teléfono
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        className="form-control"
                        name="phone"
                        value={profile.phone}
                        onChange={handleInputChange}
                        placeholder="Ingrese su teléfono"
                      />
                    ) : (
                      <p className="form-control-plaintext">
                        {profile.phone || "No especificado"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-card-text me-1"></i>
                      Tipo de Documento
                    </label>
                    {isEditing ? (
                      <select
                        className="form-select"
                        name="type_document"
                        value={profile.type_document}
                        onChange={handleInputChange}
                      >
                        <option value="">Seleccione...</option>
                        <option value="identity_card">Cédula de Ciudadanía</option>
                        <option value="foreign_card">Cédula de Extranjería</option>
                        <option value="passport">Pasaporte</option>
                      </select>
                    ) : (
                      <p className="form-control-plaintext">
                        {profile.type_document === 'identity_card' ? 'Cédula de Ciudadanía' :
                         profile.type_document === 'foreign_card' ? 'Cédula de Extranjería' :
                         profile.type_document === 'passport' ? 'Pasaporte' : 'No especificado'}
                      </p>
                    )}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">
                      <i className="bi bi-hash me-1"></i>
                      Número de Documento
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        className="form-control"
                        name="number_document"
                        value={profile.number_document}
                        onChange={handleInputChange}
                        placeholder="Ingrese su número de documento"
                      />
                    ) : (
                      <p className="form-control-plaintext">
                        {profile.number_document || "No especificado"}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    <i className="bi bi-geo-alt me-1"></i>
                    Dirección
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      className="form-control"
                      name="address"
                      value={profile.address}
                      onChange={handleInputChange}
                      placeholder="Ingrese su dirección"
                    />
                  ) : (
                    <p className="form-control-plaintext">
                      {profile.address || "No especificada"}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <>
                    <hr className="my-4" />
                    <div className="card bg-light border-0 mb-4">
                      <div className="card-body">
                        <h6 className="mb-3 d-flex align-items-center text-primary">
                          <i className="bi bi-shield-lock me-2"></i>
                          Cambiar Contraseña
                        </h6>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label small">Contraseña Actual</label>
                            <div className="input-group">
                              <input
                                type={showPassword.current ? "text" : "password"}
                                className="form-control"
                                name="currentPassword"
                                value={profile.currentPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => togglePasswordVisibility('current')}
                              >
                                <i className={`bi bi-eye${showPassword.current ? '-slash' : ''}`}></i>
                              </button>
                            </div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">Nueva Contraseña</label>
                            <div className="input-group">
                              <input
                                type={showPassword.new ? "text" : "password"}
                                className="form-control"
                                name="newPassword"
                                value={profile.newPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => togglePasswordVisibility('new')}
                              >
                                <i className={`bi bi-eye${showPassword.new ? '-slash' : ''}`}></i>
                              </button>
                            </div>
                            <div className="form-text">Mínimo 6 caracteres</div>
                          </div>
                          <div className="col-md-4">
                            <label className="form-label small">Confirmar Contraseña</label>
                            <div className="input-group">
                              <input
                                type={showPassword.confirm ? "text" : "password"}
                                className="form-control"
                                name="confirmPassword"
                                value={profile.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                              />
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => togglePasswordVisibility('confirm')}
                              >
                                <i className={`bi bi-eye${showPassword.confirm ? '-slash' : ''}`}></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {isEditing && (
                  <div className="d-flex justify-content-end mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary me-2"
                      onClick={() => {
                        setIsEditing(false);
                        setProfile(prev => ({
                          ...prev,
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: ""
                        }));
                      }}
                      disabled={saving}
                    >
                      <i className="bi bi-x-circle me-1"></i>
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
                          <i className="bi bi-check-circle me-1"></i>
                          Guardar Cambios
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;