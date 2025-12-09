import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

// Contexto para gestionar estado global y caché
const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Estado para caché de datos API
  const [apiCache, setApiCache] = useState({});
  // Estado para indicador de carga global
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref para mantener referencia actualizada del caché
  const apiCacheRef = useRef(apiCache);
  
  // Actualizar ref cuando cambia el caché
  useEffect(() => {
    apiCacheRef.current = apiCache;
  }, [apiCache]);
  
  // Función para obtener datos con caché - MEMOIZADA
  const fetchWithCache = useCallback(async (key, fetchFn, ttl = 5 * 60 * 1000) => {
    // Verificar si existe en caché y no ha expirado
    const cached = apiCacheRef.current[key];
    const now = Date.now();
    
    if (cached && cached.expiry > now) {
      return cached.data;
    }
    
    try {
      setIsLoading(true);
      const data = await fetchFn();
      
      // Guardar en caché con tiempo de expiración
      setApiCache(prev => ({
        ...prev,
        [key]: {
          data,
          expiry: now + ttl
        }
      }));
      
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ Sin dependencias - usa ref para caché actualizado
  
  // Función para invalidar caché - MEMOIZADA
  const invalidateCache = useCallback((key) => {
    if (key) {
      setApiCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      setApiCache({});
    }
  }, []); // ✅ Sin dependencias - función pura
  
  // Persistir caché en localStorage
  useEffect(() => {
    try {
      const savedCache = localStorage.getItem('app_api_cache');
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache);
        // Filtrar entradas expiradas
        const now = Date.now();
        const validCache = Object.entries(parsedCache)
          .filter(([_, value]) => value.expiry > now)
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
          
        setApiCache(validCache);
      }
    } catch (error) {
      console.warn('Error al cargar caché:', error);
    }
    
    return () => {
      // Guardar caché al desmontar usando ref actualizado
      try {
        localStorage.setItem('app_api_cache', JSON.stringify(apiCacheRef.current));
      } catch (error) {
        console.warn('Error al guardar caché:', error);
      }
    };
  }, []); // ✅ Dependencias vacías - usa ref en cleanup
  
  // Guardar caché periódicamente - OPTIMIZADO
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        // ✅ Usa ref en lugar de estado para evitar recrear el interval
        localStorage.setItem('app_api_cache', JSON.stringify(apiCacheRef.current));
      } catch (error) {
        console.warn('Error al guardar caché:', error);
      }
    }, 60000); // Cada minuto
    
    return () => clearInterval(saveInterval);
  }, []); // ✅ Solo se crea una vez - usa ref para caché actualizado
  
  // Valor del contexto MEMOIZADO para evitar re-renders innecesarios
  // apiCache removido del contexto - solo se usa internamente a través de refs
  const contextValue = useMemo(() => ({
    isLoading,
    setIsLoading,
    fetchWithCache,
    invalidateCache
    // ✅ apiCache removido - no se expone directamente, solo se usa internamente
  }), [isLoading, fetchWithCache, invalidateCache]);
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
