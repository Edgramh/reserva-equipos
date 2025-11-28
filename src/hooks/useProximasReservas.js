import { useState, useEffect } from 'react';
import { adminService } from '../services/admin.service';

export const useProximasReservas = () => {
  const [proximasReservas, setProximasReservas] = useState({
    chromebook: [],
    tablet: []
  });
  const [loading, setLoading] = useState(true);
  const [ultimaCarga, setUltimaCarga] = useState(null);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const reservas = await adminService.obtenerTodasReservas();
      
      // Obtener hoy
      const hoy = new Date().toISOString().split('T')[0];
      
      // Filtrar solo reservas de hoy en adelante
      const reservasProximas = reservas.filter(r => r.fechaStr >= hoy);
      
      // Separar por tipo de equipo
      const chromebook = reservasProximas.filter(r => r.tipoEquipo === 'chromebook');
      const tablet = reservasProximas.filter(r => r.tipoEquipo === 'tablet');
      
      setProximasReservas({
        chromebook: chromebook.slice(0, 5),
        tablet: tablet.slice(0, 5)
      });
      
      setUltimaCarga(new Date());
    } catch (error) {
      console.error('Error al cargar próximas reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Cargar al montar el componente
    cargarReservas();
    
    // Actualizar cada 60 segundos (1 minuto)
    const interval = setInterval(cargarReservas, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return { proximasReservas, loading, cargarReservas, ultimaCarga };
};