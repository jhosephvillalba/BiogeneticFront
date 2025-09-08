import React from 'react';
import { useAppContext } from '../context/AppContext';

// Estilos para el indicador de carga
const styles = {
  container: {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    height: '3px',
    backgroundColor: 'transparent',
    zIndex: 9999,
    transition: 'opacity 0.3s ease'
  },
  bar: {
    height: '100%',
    backgroundColor: '#4a90e2',
    width: '0%',
    transition: 'width 0.4s ease'
  }
};

/**
 * Componente que muestra un indicador de carga sutil en la parte superior de la página
 */
const LoadingIndicator = () => {
  const { isLoading } = useAppContext();
  const [progress, setProgress] = React.useState(0);
  
  // Efecto para animar la barra de progreso
  React.useEffect(() => {
    let interval;
    let timeout;
    
    if (isLoading) {
      // Resetear progreso
      setProgress(10);
      
      // Incrementar progreso gradualmente
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          
          // Incremento no lineal para simular carga
          const increment = (90 - prev) / 10;
          return Math.min(90, prev + increment);
        });
      }, 300);
    } else {
      // Si termina la carga, completar rápidamente
      setProgress(100);
      
      // Resetear después de la transición
      timeout = setTimeout(() => {
        setProgress(0);
      }, 500);
    }
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoading]);
  
  // No renderizar si no hay progreso
  if (progress === 0) return null;
  
  return (
    <div style={{
      ...styles.container,
      opacity: progress === 100 ? 0 : 1
    }}>
      <div 
        style={{
          ...styles.bar,
          width: `${progress}%`
        }}
      />
    </div>
  );
};

export default LoadingIndicator;
