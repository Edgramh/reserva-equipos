import { useState, useEffect } from 'react';
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from 'react-router-dom';

// IMPORTS CORRECTOS – sin BarChart3
import { 
  LogOut, 
  Home, 
  RefreshCw, 
  CalendarDays, 
  Trash2, 
  AlertCircle,
  PlusCircle
} from 'lucide-react';

import { reservasService } from "../services/reservas.service";
import { adminService } from '../services/admin.service';

export default function MisReservas() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.email) {
      cargarReservas();
    } else {
      setLoading(false);
    }
  }, [user]);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const data = await reservasService.obtenerReservasPorUsuario(user.email);
      setReservas(data || []);
    } catch (err) {
      console.error("Error:", err);
      alert("Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!confirm("¿Eliminar esta reserva?")) return;
    try {
      await adminService.eliminarReserva(id);
      setReservas(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("No se pudo eliminar");
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      {/* Header bonito */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <CalendarDays className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Mis Reservas</h1>
              <p className="text-xs text-gray-500">Colegio Mariano de Schoenstatt</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2.5 hover:bg-gray-100 rounded-lg transition" title="Inicio">
              <Home className="w-5 h-5 text-gray-600" />
            </button>

            <button 
              onClick={cargarReservas} 
              className="p-2.5 hover:bg-gray-100 rounded-lg transition" 
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>

            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:shadow-lg transition font-medium"
            >
              <PlusCircle className="w-5 h-5" />
              Nueva Reserva
            </button>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.[0] || user?.email?.[0] || "?"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700">
                {user?.name || user?.email}
              </span>
            </div>

            <button onClick={handleLogout} className="p-2.5 hover:bg-red-50 rounded-lg transition text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-gray-300 border-t-indigo-600"></div>
              <p className="mt-6 text-gray-600 text-lg">Cargando tus reservas...</p>
            </div>
          ) : reservas.length === 0 ? (
            <div className="text-center py-24">
              <CalendarDays className="w-24 h-24 mx-auto mb-6 text-gray-300" />
              <p className="text-2xl font-semibold text-gray-700 mb-4">No tienes reservas activas</p>
              <button 
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-medium hover:shadow-xl transition"
              >
                Hacer mi primera reserva
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Tus reservas ({reservas.length})</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {reservas.map(r => (
                  <div key={r.id} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-2xl font-bold text-gray-800">
                          {r.fecha?.toDate().toLocaleDateString('es-CL') || r.fechaStr}
                        </p>
                        <p className="text-lg text-gray-600">{r.curso}</p>
                      </div>
                      <button 
                        onClick={() => handleEliminar(r.id)}
                        className="p-2.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Equipo:</span>
                        <span className="font-semibold text-indigo-700">
                          {r.tipo === 'chromebook' ? 'Chromebooks' : 'Tablets'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Carros:</span>
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-bold">
                          {r.cantidadCarros || r.slots?.length}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 font-medium">Horarios:</p>
                        <p className="text-sm text-gray-700">{r.bloqueHorario}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}