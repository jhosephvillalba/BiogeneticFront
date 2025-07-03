import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBull, updateBull, createBull } from '../Api/bulls';
import { racesApi, sexesApi } from '../Api';

const BullEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Estados
  const [bull, setBull] = useState({
    name: '',
    registration_number: '',
    lote:'',
    escalerilla:'',
    description:'',
    race_id: '',
    sex_id: '',
    status: 'Active'
  });
  
  const [races, setRaces] = useState([]);
  const [sexes, setSexes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos del toro si estamos editando
  useEffect(() => {
    const loadBull = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getBull(id);
        setBull({
          name: data.name || '',
          registration_number: data.registration_number || '',
          race_id: data.race_id || '',
          sex_id: data.sex_id || '',
          status: data.status || 'active',
          description: data.description || '',
          lote: data.lote || '',
          escalerilla: data.escalerilla || ''
        });
      } catch (error) {
        console.error('Error al cargar el toro:', error);
        setError(error.response?.data?.detail || 'Error al cargar los datos del toro');
      } finally {
        setLoading(false);
      }
    };

    loadBull();
  }, [id]);

  // Cargar razas y sexos
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [racesData, sexesData] = await Promise.all([
          racesApi.getRaces(),
          sexesApi.getSexes()
        ]);
        
        setRaces(racesData);
        setSexes(sexesData);
      } catch (err) {
        console.error("Error al cargar datos de referencia:", err);
        setError("Error al cargar datos de referencia");
      }
    };
    
    loadReferenceData();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBull(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      
      const bullData = {
        ...bull,
        race_id: parseInt(bull.race_id),
        sex_id: parseInt(bull.sex_id)
      };

      if (isEditing) {
        await updateBull(id, bullData);
      } else {
        await createBull(bullData);
      }

      navigate('/bulls');
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.response?.data?.detail || 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando datos del toro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white border-bottom-0 py-3">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="bi bi-pencil-square me-2 text-primary"></i>
                  {isEditing ? 'Editar Toro' : 'Registrar Nuevo Toro'}
                </h4>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={() => navigate('/bulls')}
                >
                  <i className="bi bi-arrow-left me-1"></i> Volver
                </button>
              </div>
            </div>
            
            <div className="card-body pt-0">
              {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setError(null)}
                  ></button>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="mt-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Nombre del Toro</label>
                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={bull.name}
                        onChange={handleChange}
                        required
                        placeholder="Ej: Toro Bravo"
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Número de Registro</label>
                      <input
                        type="text"
                        className="form-control"
                        name="registration_number"
                        value={bull.registration_number}
                        onChange={handleChange}
                        required
                        placeholder="Ej: REG-12345"
                      />
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Raza</label>
                      <select 
                        className="form-select"
                        name="race_id"
                        value={bull.race_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione una raza</option>
                        {races.map(race => (
                          <option key={race.id} value={race.id}>
                            {race.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Sexo</label>
                      <select 
                        className="form-select"
                        name="sex_id"
                        value={bull.sex_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Seleccione un sexo</option>
                        {sexes.map(sex => (
                          <option key={sex.id} value={sex.id}>
                            {sex.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Lote</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lote"
                        value={bull.lote}
                        onChange={handleChange}
                        required
                        placeholder="Ej: REG-12345"
                      />
                    </div>
                  </div> 
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Escalerilla</label>
                      <input
                        type="text"
                        className="form-control"
                        name="escalerilla"
                        value={bull.escalerilla}
                        onChange={handleChange}
                        required
                        placeholder="Ej: REG-12345"
                      />
                    </div>
                  </div> 

                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Descripción</label>
                      <input
                        type="text"
                        className="form-control"
                        name="description"
                        value={bull.description}
                        onChange={handleChange}
                        required
                        placeholder="Ej: REG-12345"
                      />
                    </div>
                  </div> 
                </div>
                
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={() => navigate('/bulls')}
                    disabled={saving}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        {isEditing ? 'Guardar cambios' : 'Registrar toro'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BullEdit;