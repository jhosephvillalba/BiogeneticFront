import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBull, updateBull, createBull } from '../api/bulls';
import { racesApi, sexesApi } from '../api';

const BullEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Estados
  const [bull, setBull] = useState({
    name: '',
    register: '',
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
          register: data.register || '',
          race_id: data.race_id || '',
          sex_id: data.sex_id || '',
          status: data.status || 'Active'
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
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-2">Cargando datos del toro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                <i className="bi bi-database-fill me-2"></i>
                {isEditing ? 'Editar Toro' : 'Nuevo Toro'}
              </h5>
            </div>
            
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={bull.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Registro</label>
                  <input
                    type="text"
                    className="form-control"
                    name="register"
                    value={bull.register}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Raza</label>
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

                <div className="mb-3">
                  <label className="form-label">Sexo</label>
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

                <div className="mb-3">
                  <label className="form-label">Estado</label>
                  <select 
                    className="form-select"
                    name="status"
                    value={bull.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="Active">Activo</option>
                    <option value="Inactive">Inactivo</option>
                  </select>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/bulls')}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="submit"
                    className="btn btn-primary"
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
                        {isEditing ? 'Guardar cambios' : 'Crear toro'}
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