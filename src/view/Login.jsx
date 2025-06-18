import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../Api";
import logo from "../assets/logo.svg";

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
      
      setUser({
        token: authResponse.access_token,
      });

      navigate("/inventory");
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row justify-content-center w-100">
        <div className="col-md-6 col-lg-4">
          <div className="text-center mb-4">
            <img 
              src={logo} 
              alt="Logo" 
              className="img-fluid mb-4" 
              style={{ maxHeight: '140px' }}
            />
          </div>
          
          {error && (
            <div className="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {error}
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}
          
          {!showForgotPassword ? (
            <div className="card shadow-lg border-0">
              <div className="card-body">
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
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Autenticando...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-box-arrow-in-right me-2"></i>
                          Ingresar
                        </>
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
            <div className="card shadow-lg border-0">
              <div className="card-body">
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

