import { useState, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';

/**
 * Hook para realizar llamadas a API con caché y estado de carga
 * @param {Function} apiFn - Función de API a llamar
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - { data, loading, error, execute, reset }
 */
export const useApi = (apiFn, options = {}) => {
  const { 
    cacheKey = null,
    ttl = 5 * 60 * 1000, // 5 minutos por defecto
    initialData = null,
    onSuccess = () => {},
    onError = () => {},
  } = options;
  
  const { fetchWithCache, invalidateCache } = useAppContext();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Función para ejecutar la llamada a la API
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      // Si hay clave de caché, usar fetchWithCache
      if (cacheKey) {
        const cacheKeyWithArgs = `${cacheKey}:${JSON.stringify(args)}`;
        result = await fetchWithCache(cacheKeyWithArgs, () => apiFn(...args), ttl);
      } else {
        // Sin caché, llamada directa
        result = await apiFn(...args);
      }
      
      setData(result);
      onSuccess(result);
      return result;
    } catch (err) {
      console.error('Error en llamada a API:', err);
      setError(err);
      onError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFn, cacheKey, fetchWithCache, ttl, onSuccess, onError]);
  
  // Función para invalidar caché
  const refresh = useCallback(() => {
    if (cacheKey) {
      invalidateCache(cacheKey);
    }
    return execute();
  }, [cacheKey, execute, invalidateCache]);
  
  // Función para resetear el estado
  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);
  
  return {
    data,
    loading,
    error,
    execute,
    refresh,
    reset
  };
};

export default useApi;
