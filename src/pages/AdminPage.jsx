import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, Users, Calendar, Trash2, Edit2, Home, RefreshCw, AlertCircle } from 'lucide-react';
import { adminService } from '../services/admin.service';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reservas');
  const [reservas, setReservas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroCurso, setFiltroCurso] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [reservasData, stats] = await Promise.all([
        adminService.obtenerTodasReservas(),
        adminService.obtenerEstadisticas()
      ]);
      setReservas(reservasData);
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarReserva = async (id) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      try {
        await adminService.eliminarReserva(id);
        cargarDatos();
      } catch (error) {
        alert('Error al eliminar la reserva');
      }
    }
  };

  const reservasFiltradas = reservas.filter(r => {
    if (filtroFecha && r.fechaStr !== filtroFecha) return false;
    if (filtroCurso && r.curso !== filtroCurso) return false;
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Panel Administrativo</h1>
              <p className="text-xs text-gray-500">Colegio Mariano</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600"
              title="Volver a reservas"
            >
              <Home className="w-5 h-5" />
            </button>
            <button
              onClick={cargarDatos}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('reservas')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'reservas'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Reservas
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'estadisticas'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Estadísticas
            </button>
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'usuarios'
                  ? 'text-indigo-600 border-indigo-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Usuarios
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-8 py-6">
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'reservas' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestionar Reservas</h2>
              
              {/* Filtros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                  placeholder="Filtrar por fecha"
                />
                <input
                  type="text"
                  value={filtroCurso}
                  onChange={(e) => setFiltroCurso(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
                  placeholder="Filtrar por curso"
                />
              </div>

              {/* Tabla de Reservas */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Curso</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Usuario</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Fecha</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Equipo</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Cantidad</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Horarios</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservasFiltradas.map((reserva) => (
                      <tr key={reserva.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-800 font-medium">{reserva.curso}</td>
                        <td className="py-3 px-4 text-gray-600">
                          <div className="text-sm">{reserva.usuarioNombre}</div>
                          <div className="text-xs text-gray-400">{reserva.usuarioEmail}</div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{reserva.fechaStr}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            reserva.tipoEquipo === 'chromebook'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {reserva.tipoEquipo === 'chromebook' ? 'Chromebook' : 'Tablet'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">
                            {reserva.slots.length} {reserva.slots.length === 1 ? 'carro' : 'carros'}
                          </div>
                        </td>
                         <td className="py-3 px-4">
                          <div className="space-y-1">
                            {/* Obtener horarios únicos */}
                            {Array.from(new Set(reserva.slots.map(s => `${s.horaInicio}-${s.horaFin}`))).map((horario, idx) => (
                              <div
                                key={idx}
                                className="inline-block px-3 py-1 rounded-lg text-sm font-medium text-gray-700 bg-slate-100 mr-2 mb-1"
                              >
                                {horario}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleEliminarReserva(reserva.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {reservasFiltradas.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>No hay reservas que coincidan con los filtros</p>
                </div>
              )}
            </div>
          </div>
        )}

        {!loading && activeTab === 'estadisticas' && estadisticas && (
          <div className="space-y-6">
            {/* Tarjetas de Resumen */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <p className="text-gray-500 text-sm mb-2">Total de Reservas</p>
                <p className="text-4xl font-bold text-indigo-600">{estadisticas.totalReservas}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <p className="text-gray-500 text-sm mb-2">Chromebooks Reservados</p>
                <p className="text-4xl font-bold text-blue-600">{estadisticas.porEquipo.chromebook}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <p className="text-gray-500 text-sm mb-2">Tablets Reservadas</p>
                <p className="text-4xl font-bold text-purple-600">{estadisticas.porEquipo.tablet}</p>
              </div>
            </div>

            {/* Top Usuarios */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Top Usuarios (Más Reservas)</h3>
              <div className="space-y-3">
                {estadisticas.porUsuario.slice(0, 10).map((usuario, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800">{usuario.nombre}</p>
                      <p className="text-xs text-gray-500">{usuario.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-indigo-600">{usuario.cantidad}</p>
                      <p className="text-xs text-gray-500">reservas</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reservas por Curso */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Reservas por Curso</h3>
              <div className="space-y-2">
                {Object.entries(estadisticas.porCurso).sort((a, b) => b[1] - a[1]).map(([curso, cantidad]) => (
                  <div key={curso} className="flex items-center justify-between">
                    <span className="text-gray-700">{curso}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-200 rounded-full">
                        <div 
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${(cantidad / estadisticas.totalReservas) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-700 font-medium w-8 text-right">{cantidad}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'usuarios' && estadisticas && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Resumen de Usuarios</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {estadisticas.porUsuario.map((usuario, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-800">{usuario.nombre}</p>
                      <p className="text-sm text-gray-500">{usuario.email}</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                      {usuario.cantidad}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Últimas Reservas:</p>
                    {usuario.ultimas.slice(0, 3).map((reserva, ridx) => (
                      <div key={ridx} className="text-xs text-gray-600">
                        📅 {reserva.fecha} - {reserva.curso} ({reserva.equipos})
                      </div>
                    ))}
                    {usuario.ultimas.length > 3 && (
                      <div className="text-xs text-gray-400">... y {usuario.ultimas.length - 3} más</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}