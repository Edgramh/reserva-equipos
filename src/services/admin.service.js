import { 
  collection, 
  query, 
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  where
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'reservas';

export const adminService = {
  // Obtener todas las reservas
  obtenerTodasReservas: async () => {
    try {
      // Primero obtener SIN orderBy
      const q = query(
        collection(db, COLLECTION),
        where('estado', '==', 'confirmada')
      );
      
      const snapshot = await getDocs(q);
      const reservas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Luego ordenar en el cliente
      return reservas.sort((a, b) => {
        const fechaA = new Date(a.fechaStr);
        const fechaB = new Date(b.fechaStr);
        return fechaB - fechaA;
      });
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      return [];
    }
  },

  // Obtener reservas por rango de fechas
  obtenerReservasPorRango: async (fechaInicio, fechaFin) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('estado', '==', 'confirmada')
      );
      
      const snapshot = await getDocs(q);
      const reservas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filtrar en el cliente
      return reservas.filter(r => 
        r.fechaStr >= fechaInicio && r.fechaStr <= fechaFin
      ).sort((a, b) => new Date(a.fechaStr) - new Date(b.fechaStr));
    } catch (error) {
      console.error('Error al obtener reservas por rango:', error);
      return [];
    }
  },

  // Eliminar reserva
  eliminarReserva: async (reservaId) => {
    try {
      await deleteDoc(doc(db, COLLECTION, reservaId));
      return true;
    } catch (error) {
      console.error('Error al eliminar reserva:', error);
      throw error;
    }
  },

  // Actualizar reserva
  actualizarReserva: async (reservaId, datos) => {
    try {
      const docRef = doc(db, COLLECTION, reservaId);
      await updateDoc(docRef, {
        ...datos,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error al actualizar reserva:', error);
      throw error;
    }
  },

  // Obtener estadísticas
  obtenerEstadisticas: async () => {
    try {
      const reservas = await adminService.obtenerTodasReservas();
      
      // Contar por usuario
      const porUsuario = {};
      reservas.forEach(r => {
        if (!porUsuario[r.usuarioEmail]) {
          porUsuario[r.usuarioEmail] = {
            nombre: r.usuarioNombre,
            email: r.usuarioEmail,
            cantidad: 0,
            ultimas: []
          };
        }
        porUsuario[r.usuarioEmail].cantidad++;
        porUsuario[r.usuarioEmail].ultimas.push({
          curso: r.curso,
          fecha: r.fechaStr,
          equipos: r.tipoEquipo
        });
      });

      // Contar por curso
      const porCurso = {};
      reservas.forEach(r => {
        if (!porCurso[r.curso]) {
          porCurso[r.curso] = 0;
        }
        porCurso[r.curso]++;
      });

      // Contar por equipo
      const porEquipo = {
        chromebook: 0,
        tablet: 0
      };
      reservas.forEach(r => {
        porEquipo[r.tipoEquipo]++;
      });

      return {
        totalReservas: reservas.length,
        porUsuario: Object.values(porUsuario).sort((a, b) => b.cantidad - a.cantidad),
        porCurso,
        porEquipo,
        reservas
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }
};