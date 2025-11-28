import { useState, useEffect } from 'react';
import { reservasService } from '../services/reservas.service';

export const useReservas = (fecha, curso) => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fecha && curso) {
      cargarReservas();
    }
  }, [fecha, curso]);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const data = await reservasService.obtenerReservasPorFecha(fecha);
      setReservas(data || []);
    } catch (error) {
      console.error('Error cargando reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  return { reservas, loading, cargarReservas };
};