import React, { useState, useEffect } from 'react';
import { Pagination } from 'react-bootstrap';
import { racesApi } from '../Api'; // Importamos los servicios de razas

const BreedManagement = () => {
  const [breedForm, setBreedForm] = useState({
    id: '',
    name: '',
    description: '',
    breedCode: ''
  });

  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const breedsPerPage = 5;
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Función para cargar las razas desde la API
  const loadBreeds = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await racesApi.getRaces();
      console.log("Razas obtenidas:", data);
      
      // Transformar los datos de la API al formato que espera nuestro componente
      const formattedBreeds = data.map(race => ({
        id: race.id.toString(),
        name: race.name,
        description: race.description,
        breedCode: race.code
      }));
      
      setBreeds(formattedBreeds);
    } catch (err) {
      console.error("Error al cargar razas:", err);
      setError("No se pudieron cargar las razas. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBreeds();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBreedForm({ ...breedForm, [name]: value });
  };

  const clearForm = () => {
    setBreedForm({
      id: '',
      name: '',
      description: '',
      breedCode: ''
    });
  };

  const loadBreedForEdit = (breed) => {
    setBreedForm(breed);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (breedForm.id) {
        // Actualizar raza existente
        const updateData = {
          name: breedForm.name,
          description: breedForm.description,
          code: breedForm.breedCode
        };
        
        await racesApi.updateRace(breedForm.id, updateData);
        // Recargar las razas para obtener los datos actualizados
        await loadBreeds();
      } else {
        // Crear nueva raza
        const newRaceData = {
          name: breedForm.name,
          description: breedForm.description,
          code: breedForm.breedCode || generateBreedCode(breedForm.name)
        };
        
        await racesApi.createRace(newRaceData);
        // Recargar las razas para incluir la nueva
        await loadBreeds();
      }
      
      clearForm();
    } catch (err) {
      console.error("Error al guardar raza:", err);
      setError("No se pudo guardar la raza. Por favor, intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const generateBreedCode = (name) => {
    if (!name) return '';
    return name.replace(/\s+/g, '').substring(0, 6).toUpperCase();
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta raza?')) {
      setLoading(true);
      try {
        await racesApi.deleteRace(id);
        // Actualizar estado local
        setBreeds(breeds.filter(b => b.id !== id));
        if (breedForm.id === id) clearForm();
      } catch (err) {
        console.error("Error al eliminar raza:", err);
        setError("No se pudo eliminar la raza. Por favor, intente nuevamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleDescription = (id) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Pagination logic
  const indexOfLastBreed = currentPage * breedsPerPage;
  const indexOfFirstBreed = indexOfLastBreed - breedsPerPage;
  const currentBreeds = breeds.slice(indexOfFirstBreed, indexOfLastBreed);
  const totalPages = Math.ceil(breeds.length / breedsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="container-fluid py-4 breed-management">
      {/* Mostrar errores si existen */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} aria-label="Close"></button>
        </div>
      )}
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">
          <i className="bi bi-pencil-square me-2"></i>
          Gestión de Razas
        </h2>
        <span className="badge bg-primary rounded-pill p-2">
          {breeds.length} razas registradas
        </span>
      </div>
      
      <div className="row">
        {/* Formulario */}
        <div className="col-lg-5 mb-4">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                {breedForm.id ? (
                  <><i className="bi bi-pencil-fill me-2"></i>Editar Raza</>
                ) : (
                  <><i className="bi bi-plus-circle-fill me-2"></i>Crear Nueva Raza</>
                )}
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">Nombre de la Raza*</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={breedForm.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Golden Retriever"
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-bold">Descripción</label>
                  <textarea
                    className="form-control"
                    name="description"
                    rows="5"
                    value={breedForm.description}
                    onChange={handleInputChange}
                    placeholder="Descripción detallada de la raza..."
                    style={{ minHeight: '120px' }}
                  />
                  <small className="text-muted">Sin límite de caracteres</small>
                </div>
                
                <div className="mb-4">
                  <label className="form-label fw-bold">Código de Raza</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      name="breedCode"
                      value={breedForm.breedCode}
                      onChange={handleInputChange}
                      style={{textTransform: 'uppercase'}}
                      placeholder="Ej: GOLDRET"
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => setBreedForm({
                        ...breedForm,
                        breedCode: generateBreedCode(breedForm.name)
                      })}
                    >
                      <i className="bi bi-magic me-1"></i>Generar
                    </button>
                  </div>
                  <small className="text-muted">Máximo 6 caracteres. Dejar vacío para generar automáticamente</small>
                </div>
                
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={clearForm}
                  >
                    <i className="bi bi-eraser-fill me-1"></i>Limpiar
                  </button>
                  
                  <button type="submit" className="btn btn-primary">
                    {breedForm.id ? (
                      <><i className="bi bi-save-fill me-1"></i>Actualizar</>
                    ) : (
                      <><i className="bi bi-plus-circle-fill me-1"></i>Crear</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        {/* Lista de Razas */}
        <div className="col-lg-7">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-ul me-2"></i>
                Lista de Razas
              </h5>
              <div className="input-group" style={{width: '200px'}}>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Buscar raza..."
                />
                <button className="btn btn-sm btn-outline-primary" type="button">
                  <i className="bi bi-search"></i>
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Cargando razas...</p>
              </div>
            ) : (
              <>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{width: '100px'}}>Código</th>
                          <th>Nombre</th>
                          <th style={{width: '40%'}}>Descripción</th>
                          <th style={{width: '120px'}}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBreeds.length > 0 ? (
                          currentBreeds.map((breed) => (
                            <tr key={breed.id}>
                              <td>
                                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill p-2">
                                  {breed.breedCode}
                                </span>
                              </td>
                              <td className="fw-semibold">{breed.name}</td>
                              <td>
                                <div className={`breed-description ${expandedDescriptions[breed.id] ? 'expanded' : ''}`}>
                                  {breed.description}
                                </div>
                                {breed.description && breed.description.length > 100 && (
                                  <button 
                                    className="btn btn-link p-0 text-primary small"
                                    onClick={() => toggleDescription(breed.id)}
                                  >
                                    {expandedDescriptions[breed.id] ? 'Mostrar menos' : 'Mostrar más'}
                                  </button>
                                )}
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => loadBreedForEdit(breed)}
                                    title="Editar"
                                  >
                                    <i className="bi bi-pencil-fill"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDelete(breed.id)}
                                    title="Eliminar"
                                  >
                                    <i className="bi bi-trash-fill"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center py-4 text-muted">
                              <i className="bi bi-inbox" style={{fontSize: '2rem'}}></i>
                              <p className="mt-2">No hay razas registradas</p>
                              <button 
                                className="btn btn-sm btn-primary mt-2"
                                onClick={clearForm}
                              >
                                <i className="bi bi-plus-circle-fill me-1"></i>Crear primera raza
                              </button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Paginación */}
                {breeds.length > breedsPerPage && (
                  <div className="card-footer bg-white border-0">
                    <nav>
                      <Pagination className="justify-content-center mb-0">
                        <Pagination.Prev 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                          disabled={currentPage === 1}
                        />
                        
                        {Array.from({length: totalPages}, (_, i) => i + 1).map(number => (
                          <Pagination.Item
                            key={number}
                            active={number === currentPage}
                            onClick={() => paginate(number)}
                          >
                            {number}
                          </Pagination.Item>
                        ))}
                        
                        <Pagination.Next 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Estilos personalizados */}
      <style jsx>{`
        .breed-management {
          background-color: #f8f9fa;
        }
        .card {
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .breed-description {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .breed-description.expanded {
          display: block;
          -webkit-line-clamp: unset;
        }
        .table th {
          font-weight: 600;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: #6c757d;
        }
        .btn-group-sm > .btn {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default BreedManagement;