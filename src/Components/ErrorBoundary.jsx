import React from 'react';
import { logger } from '../utils/errorHandler';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isLazyLoadingError: false
    };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Detectar errores de lazy loading (carga de módulos)
    const isLazyLoadingError = 
      (error.message && (
        error.message.includes('Loading chunk') ||
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('ChunkLoadError')
      )) ||
      (error.name === 'ChunkLoadError');
    
    if (isLazyLoadingError) {
      logger.error('Error de carga de módulo lazy:', error);
      logger.error('Error Info:', errorInfo);
      // Los errores de lazy loading pueden ser temporales (red, caché)
      // Se puede intentar recargar la página automáticamente
    } else {
      // Registrar el error normal
      logger.error('Error capturado por ErrorBoundary:', error);
      logger.error('Error Info:', errorInfo);
    }
    
    this.setState({
      errorInfo: errorInfo,
      isLazyLoadingError // Agregar flag para UI específica
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
              {this.state.isLazyLoadingError ? 'Error de Carga de Módulo' : 'Error de Renderizado'}
            </h4>
            <p>
              {this.state.isLazyLoadingError 
                ? 'No se pudo cargar un módulo de la aplicación. Esto puede deberse a un problema de conexión o caché.'
                : 'Ha ocurrido un error inesperado en la aplicación.'}
            </p>
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
