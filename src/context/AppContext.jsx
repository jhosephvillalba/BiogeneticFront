import React, { createContext, useContext, useState, useEffect } from 'react';

// Contexto para gestionar estado global y caché
const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Estado para caché de datos API
  const [apiCache, setApiCache] = useState({});
  // Estado para indicador de carga global
  const [isLoading, setIsLoading] = useState(false);
  
  // Función para obtener datos con caché
  const fetchWithCache = async (key, fetchFn, ttl = 5 * 60 * 1000) => {
    // Verificar si existe en caché y no ha expirado
    const cached = apiCache[key];
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
  };
  
  // Función para invalidar caché
  const invalidateCache = (key) => {
    if (key) {
      setApiCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    } else {
      setApiCache({});
    }
  };
  
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
      // Guardar caché al desmontar
      try {
        localStorage.setItem('app_api_cache', JSON.stringify(apiCache));
      } catch (error) {
        console.warn('Error al guardar caché:', error);
      }
    };
  }, []);
  
  // Guardar caché periódicamente
  useEffect(() => {
    const saveInterval = setInterval(() => {
      try {
        localStorage.setItem('app_api_cache', JSON.stringify(apiCache));
      } catch (error) {
        console.warn('Error al guardar caché:', error);
      }
    }, 60000); // Cada minuto
    
    return () => clearInterval(saveInterval);
  }, [apiCache]);
  
  return (
    <AppContext.Provider value={{
      isLoading,
      setIsLoading,
      fetchWithCache,
      invalidateCache,
      apiCache
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
