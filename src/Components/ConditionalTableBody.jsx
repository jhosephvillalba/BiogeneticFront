import React, { memo } from 'react';

const ConditionalTableBody = memo(({ 
  loading, 
  error, 
  data, 
  emptyMessage, 
  children, 
  colSpan = 4 
}) => {
  if (loading) {
    return (
      <tr key="loading-row">
        <td colSpan={colSpan} className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos...</p>
        </td>
      </tr>
    );
  }

  if (error) {
    return (
      <tr key="error-row">
        <td colSpan={colSpan} className="text-center text-danger py-3">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {typeof error === 'string' ? error : 'Error al cargar los datos'}
        </td>
      </tr>
    );
  }

  if (!data || data.length === 0) {
    return (
      <tr key="no-data-row">
        <td colSpan={colSpan} className="text-center text-muted py-4">
          <i className="bi bi-inbox me-2"></i>
          {emptyMessage || 'No se encontraron datos'}
        </td>
      </tr>
    );
  }

  return children;
});

ConditionalTableBody.displayName = 'ConditionalTableBody';

export default ConditionalTableBody;
