import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../Api";
import logo from "../assets/logo.svg";
import fondoLogin from "../assets/fondo_login.jpg";

// Función para detectar el rol del usuario
const checkUserRole = (user) => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return 'unknown';
  }
  
  // Buscar roles por prioridad (admin > user > client)
  if (user.roles.some(role => role.id === 1 || role.name === 'Admin')) {
    return 'admin';
  } else if (user.roles.some(role => role.id === 2 || role.name === 'User')) {
    return 'user';
  } else if (user.roles.some(role => role.id === 3 || role.name === 'Client')) {
    return 'client';
  } else {
    return 'unknown';
  }
};

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const authResponse = await authApi.login({ email, password });
      
      // Obtener el perfil completo del usuario después del login
      const userProfile = await authApi.getCurrentUser();
      
      setUser({
        token: authResponse.access_token,
        ...userProfile
      });

      // Redirigir según el rol del usuario
      const userRole = checkUserRole(userProfile);
      if (userRole === 'client') {
        navigate("/reports");
      } else {
        navigate("/inventory");
      }
    } catch (error) {
      console.error("Error de autenticación:", error);
      setError("No se encontraron sus datos...");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await authApi.requestPasswordReset(resetEmail);
    setResetSent(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetSent(false);
      setResetEmail("");
    }, 3000);
    } catch (error) {
      console.error("Error al solicitar recuperación de contraseña:", error);
      setError("No se pudo procesar la solicitud. Intente más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${fondoLogin})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        margin: 0,
        padding: 0,
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    >
      <div className="row justify-content-center w-100" style={{ margin: 0, padding: 0 }}>
        <div className="col-md-5 col-lg-3" style={{ padding: 0 }}>
          {/* Overlay semi-transparente para mejorar la legibilidad */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(1.5px)',
              zIndex: 1
            }}
          ></div>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert" style={{ position: 'relative', zIndex: 2, marginBottom: '1rem' }}>
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}
          
          {!showForgotPassword ? (
            <div key="login-form" className="card shadow-lg border-0" style={{ position: 'relative', zIndex: 2, borderRadius: '20px', padding: '0.8rem' }}>
              <div className="card-body">
                <div className="text-center mb-4">
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="img-fluid mb-3" 
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <h2 className="card-title text-center mb-4 fw-bold text-primary">Iniciar Sesión</h2>
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label htmlFor="email" className="form-label text-muted">
                      <i className="bi bi-envelope me-2"></i>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="password" className="form-label text-muted">
                      <i className="bi bi-lock me-2"></i>
                      Contraseña
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-lg"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="d-grid mb-4">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-lg"
                      disabled={loading}
                      key="login-button"
                    >
                      {loading ? (
                        <span key="loading-content">
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Autenticando...
                        </span>
                      ) : (
                        <span key="normal-content">
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Ingresar
                        </span>
                      )}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={loading}
                    >
                      <i className="bi bi-question-circle me-1"></i>
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div key="forgot-password-form" className="card shadow-lg border-0" style={{ position: 'relative', zIndex: 2, borderRadius: '20px', padding: '0.8rem' }}>
              <div className="card-body">
                <div className="text-center mb-4">
                  <img 
                    src={logo} 
                    alt="Logo" 
                    className="img-fluid mb-3" 
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <h2 className="card-title text-center mb-4 fw-bold text-primary">
                  <i className="bi bi-key me-2"></i>
                  Recuperar Contraseña
                </h2>
                {resetSent ? (
                  <div className="alert alert-success shadow-sm">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Se ha enviado un correo a {resetEmail} con instrucciones
                    para restablecer tu contraseña.
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset}>
                    <div className="mb-4">
                      <p className="text-muted">
                        <i className="bi bi-info-circle me-2"></i>
                        Ingresa tu correo electrónico y te enviaremos
                        instrucciones para restablecer tu contraseña.
                      </p>
                      <label htmlFor="resetEmail" className="form-label text-muted">
                        <i className="bi bi-envelope me-2"></i>
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        className="form-control form-control-lg"
                        id="resetEmail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        placeholder="ejemplo@correo.com"
                      />
                    </div>
                    <div className="d-grid gap-3">
                      <button type="submit" className="btn btn-primary btn-lg">
                        <i className="bi bi-send me-2"></i>
                        Enviar Instrucciones
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-lg"
                        onClick={() => setShowForgotPassword(false)}
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        Volver al Login
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;

