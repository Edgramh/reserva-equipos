import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../services/admin.service';

export default function CancelarReserva() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelado, setCancelado] = useState(false);

  useEffect(() => {
    adminService.obtenerReservaPorId(id)
      .then(setReserva)
      .catch(() => setReserva(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelar = async () => {
    if (confirm("¿Seguro que deseas cancelar esta reserva?")) {
      await adminService.eliminarReserva(id);
      setCancelado(true);
      setTimeout(() => navigate("/"), 5000);
    }
  };

  if (loading) return <div className="text-center py-20">Cargando...</div>;
  if (!reserva) return <div className="text-center py-20 text-red-600">Reserva no encontrada o ya cancelada</div>;
  if (cancelado) return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md">
        <h2 className="text-3xl font-bold text-green-600 mb-4">¡Reserva cancelada!</h2>
        <p>Serás redirigido en 5 segundos...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">¿Cancelar esta reserva?</h2>
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-3">
          <p><strong>Docente:</strong> {reserva.usuarioNombre}</p>
          <p><strong>Fecha:</strong> {reserva.fecha}</p>
          <p><strong>Bloque:</strong> {reserva.bloqueHorario}</p>
          <p><strong>Equipos:</strong> {reserva.tipo === 'chromebook' ? 'Chromebooks' : 'Tablets'} ({reserva.slots.length} carros)</p>
          <p><strong>Curso:</strong> {reserva.curso}</p>
        </div>
        <button
          onClick={handleCancelar}
          className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold py-4 rounded-xl hover:shadow-xl transition"
        >
          Sí, cancelar reserva
        </button>
        <button
          onClick={() => navigate("/")}
          className="w-full mt-4 text-gray-600 hover:text-gray-800"
        >
          No, volver atrás
        </button>
      </div>
    </div>
  );
}