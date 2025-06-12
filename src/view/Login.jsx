import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../Api";

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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          {error && (
            <div className="alert alert-danger mb-3">{error}</div>
          )}
          
          {!showForgotPassword ? (
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-center mb-4">Iniciar Sesión</h2>
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="d-grid mb-3">
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Autenticando...
                        </>
                      ) : (
                        'Ingresar'
                      )}
                    </button>
                  </div>
                  <div className="text-center">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => setShowForgotPassword(true)}
                      disabled={loading}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <h2 className="card-title text-center mb-4">
                  Recuperar Contraseña
                </h2>
                {resetSent ? (
                  <div className="alert alert-success">
                    Se ha enviado un correo a {resetEmail} con instrucciones
                    para restablecer tu contraseña.
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset}>
                    <div className="mb-3">
                      <p>
                        Ingresa tu correo electrónico y te enviaremos
                        instrucciones para restablecer tu contraseña.
                      </p>
                      <label htmlFor="resetEmail" className="form-label">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="resetEmail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="d-grid gap-2">
                      <button type="submit" className="btn btn-primary">
                        Enviar Instrucciones
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowForgotPassword(false)}
                      >
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
