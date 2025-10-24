import React, { useState, useEffect, useRef } from 'react';

const ClientSearchSelect = ({ 
  clients = [], 
  onClientSelect, 
  selectedClient, 
  loading = false,
  placeholder = "Buscar y seleccionar cliente...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState(clients);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filtrar clientes basado en el término de búsqueda
  useEffect(() => {
    console.log('ClientSearchSelect - clients recibidos:', clients);
    console.log('ClientSearchSelect - searchTerm:', searchTerm);
    
    if (!searchTerm.trim()) {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.number_document?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('ClientSearchSelect - clientes filtrados:', filtered);
      setFilteredClients(filtered);
    }
    setHighlightedIndex(-1);
  }, [searchTerm, clients]);

  // Manejar clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleClientClick = (client) => {
    onClientSelect(client);
    setSearchTerm(client.full_name || '');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        return;
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredClients.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredClients.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredClients[highlightedIndex]) {
          handleClientClick(filteredClients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const clearSelection = () => {
    onClientSelect(null);
    setSearchTerm('');
    inputRef.current?.focus();
  };

  return (
    <div className={`position-relative ${className}`} ref={dropdownRef}>
      <div className="input-group">
        <span className="input-group-text">
          <i className="bi bi-search"></i>
        </span>
        <input
          ref={inputRef}
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          disabled={loading}
        />
        {selectedClient && (
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={clearSelection}
            title="Limpiar selección"
          >
            <i className="bi bi-x"></i>
          </button>
        )}
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
        >
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'}`}></i>
        </button>
      </div>

      {/* Dropdown de resultados */}
      {isOpen && (
        <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-lg" 
             style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto' }}>
          {loading ? (
            <div className="p-3 text-center">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <span className="ms-2">Cargando clientes...</span>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="p-3 text-muted text-center">
              <i className="bi bi-person-x display-6"></i>
              <p className="mb-0 mt-2">
                {searchTerm ? 'No se encontraron clientes' : 'No hay clientes disponibles'}
              </p>
            </div>
          ) : (
            <div className="list-group list-group-flush">
              {filteredClients.map((client, index) => (
                <button
                  key={client.id}
                  type="button"
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    index === highlightedIndex ? 'active' : ''
                  }`}
                  onClick={() => handleClientClick(client)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div>
                    <div className="fw-bold">
                      {client.full_name || 'Sin nombre'}
                    </div>
                    <small className="text-muted">
                      {client.email}
                    </small>
                    <br />
                    <small className="text-muted">
                      Doc: {client.number_document}
                    </small>
                  </div>
                  <div className="text-end">
                    <small className="text-muted">
                      {client.phone || 'Sin teléfono'}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Información del cliente seleccionado */}
      {selectedClient && (
        <div className="mt-2 p-2 bg-light rounded border">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>{selectedClient.full_name}</strong>
              <br />
              <small className="text-muted">{selectedClient.email}</small>
              <br />
              <small className="text-muted">Doc: {selectedClient.number_document}</small>
            </div>
            <span className="badge bg-success">
              <i className="bi bi-check-circle me-1"></i>
              Seleccionado
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSearchSelect;
