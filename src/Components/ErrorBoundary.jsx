import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Actualiza el state para mostrar la UI de error
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Puedes registrar el error en un servicio de reportes
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Puedes renderizar cualquier UI de error personalizada
      return (
        <div className="container-fluid py-4">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Error de Renderizado
            </h4>
            <p>Ha ocurrido un error inesperado. Por favor, recarga la página.</p>
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
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <i className="bi bi-arrow-left me-1"></i>
                Intentar de Nuevo
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
