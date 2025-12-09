import { useState, useCallback, useRef, useEffect } from 'react';
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
  
  // Refs para callbacks inestables - OPTIMIZADO
  const apiFnRef = useRef(apiFn);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const initialDataRef = useRef(initialData);
  
  // Actualizar refs cuando cambian los callbacks
  useEffect(() => {
    apiFnRef.current = apiFn;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
    initialDataRef.current = initialData;
  }, [apiFn, onSuccess, onError, initialData]);
  
  // Función para ejecutar la llamada a la API - OPTIMIZADA
  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      
      let result;
      
      // Si hay clave de caché, usar fetchWithCache
      if (cacheKey) {
        const cacheKeyWithArgs = `${cacheKey}:${JSON.stringify(args)}`;
        result = await fetchWithCache(cacheKeyWithArgs, () => apiFnRef.current(...args), ttl);
      } else {
        // Sin caché, llamada directa
        result = await apiFnRef.current(...args);
      }
      
      setData(result);
      onSuccessRef.current(result);
      return result;
    } catch (err) {
      console.error('Error en llamada a API:', err);
      setError(err);
      onErrorRef.current(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetchWithCache, ttl]); // ✅ Solo dependencias estables
  
  // Función para invalidar caché
  const refresh = useCallback(() => {
    if (cacheKey) {
      invalidateCache(cacheKey);
    }
    return execute();
  }, [cacheKey, execute, invalidateCache]);
  
  // Función para resetear el estado - OPTIMIZADA
  const reset = useCallback(() => {
    setData(initialDataRef.current);
    setLoading(false);
    setError(null);
  }, []); // ✅ Sin dependencias - usa ref
  
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
