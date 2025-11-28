import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION = 'reservas';

export const reservasService = {
  // Crear nueva reserva
  crearReserva: async (reservaData, user) => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...reservaData,
        usuarioId: user.uid,
        usuarioEmail: user.email,
        usuarioNombre: user.name,
        estado: 'confirmada',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      return { id: docRef.id, ...reservaData };
    } catch (error) {
      console.error('Error al crear reserva:', error);
      throw error;
    }
  },

  // Obtener reservas por fecha
  obtenerReservasPorFecha: async (fechaStr) => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('fechaStr', '==', fechaStr),
        where('estado', '==', 'confirmada')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error al obtener reservas:', error);
      return [];
    }
  }
};