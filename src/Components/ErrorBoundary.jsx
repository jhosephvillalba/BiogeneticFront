import React from 'react';
import { logger } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Registrar el error
    logger.error('Error capturado por ErrorBoundary:', error);
    logger.error('Error Info:', errorInfo);
    
    this.setState({
      errorInfo: errorInfo
    });
    
    // Aquí podrías enviar el error a un servicio de monitoreo
    // sendErrorToMonitoring(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // UI de error mejorada
      return (
        <div className="container-fluid py-4">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Error de Renderizado
            </h4>
            <p>Ha ocurrido un error inesperado en la aplicación.</p>
            <p>Por favor, intenta recargar la página o contacta a soporte si el problema persiste.</p>
            
            {this.state.error && (
              <details className="text-start mt-3">
                <summary>Detalles del error</summary>
                <pre className="text-danger small mt-2">
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <hr />
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-danger btn-sm"
                onClick={() => window.location.reload()}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Recargar Página
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Intentar de Nuevo
              </button>
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={() => window.location.href = '/login'}
              >
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
