import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useProximasReservas } from '../hooks/useProximasReservas';
import { adminService } from '../services/admin.service';

export default function TabletPage() {
  const { proximasReservas, loading, cargarReservas, ultimaCarga } = useProximasReservas();
  const [horarios, setHorarios] = useState([]);
  const [daysOffset, setDaysOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    cargarReservas();
    const interval = setInterval(cargarReservas, 180000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const horariosData = [
      { inicio: '8:10', fin: '8:55', bloque: 0 },
      { inicio: '8:55', fin: '9:40', bloque: 1 },
      { inicio: '9:55', fin: '10:40', bloque: 2 },
      { inicio: '10:40', fin: '11:25', bloque: 3 },
      { inicio: '11:45', fin: '12:30', bloque: 4 },
      { inicio: '12:30', fin: '13:10', bloque: 5 },
      { inicio: '13:10', fin: '13:55', bloque: 6 },
      { inicio: '14:40', fin: '15:20', bloque: 7 },
      { inicio: '15:20', fin: '16:00', bloque: 8 }
    ];
    setHorarios(horariosData);
  }, []);

  const handleEliminarReserva = async (id) => {
    if (confirm('¿Eliminar esta reserva?')) {
      try {
        await adminService.eliminarReserva(id);
        cargarReservas();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const getSelectedDate = () => {
    const d = new Date(currentTime);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Header: "Jueves - Hora 22:06"
  const formatHeaderDate = () => {
    const d = getSelectedDate();
    const dayName = d.toLocaleDateString('es-CL', { weekday: 'long' })
      .charAt(0).toUpperCase() + d.toLocaleDateString('es-CL', { weekday: 'long' }).slice(1);
    const time = currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    return `${dayName} - Hora ${time}`;
  };

  // NUEVA FUNCIÓN: Fecha central en formato "26 de Nov 2025"
  const getNavigationDateLabel = () => {
    const d = getSelectedDate();
    const day = d.getDate();
    const month = d.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '');
    const year = d.getFullYear();
    const isToday = daysOffset === 0;

    return (
      <span className={isToday ? 'text-yellow-300 font-bold' : 'text-white'}>
        {day} de {month} {year}
        {isToday}
      </span>
    );
  };

  const getSelectedDateStr = () => {
    const d = getSelectedDate();
    return d.toISOString().split('T')[0];
  };

  const obtenerReservasUnicasPorBloque = (tipoEquipo, fechaStr) => {
    const reservas = tipoEquipo === 'chromebook' ? proximasReservas.chromebook : proximasReservas.tablet;
    const agrupadas = {};

    horarios.forEach(h => {
      agrupadas[h.bloque] = [];
    });

    reservas.forEach(reserva => {
      if (reserva.fechaStr !== fechaStr) return;
      
      reserva.slots.forEach(slot => {
        if (!agrupadas[slot.bloque].find(r => r.id === reserva.id)) {
          agrupadas[slot.bloque].push(reserva);
        }
      });
    });

    return agrupadas;
  };

  const selectedDateStr = getSelectedDateStr();
  const chromebooksReservas = obtenerReservasUnicasPorBloque('chromebook', selectedDateStr);
  const tabletsReservas = obtenerReservasUnicasPorBloque('tablet', selectedDateStr);
  const canGoBack = daysOffset > -6;
  const canGoForward = daysOffset < 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">Sistema de Reservas de Equipos</h1>
          <p className="text-blue-200 text-sm mt-1">{formatHeaderDate()}</p>
        </div>

        {/* Navegación de Fechas - Centrado */}
        <div className="flex items-center justify-center gap-3 flex-shrink-0">
          <button
            onClick={() => setDaysOffset(daysOffset - 1)}
            disabled={!canGoBack}
            className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
            title="Día anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* AQUÍ ESTÁ EL ÚNICO CAMBIO REAL */}
          <div className="text-center min-w-[120px]">
            <p className="text-white font-semibold text-sm">
              {getNavigationDateLabel()}
            </p>
          </div>

          <button
            onClick={() => setDaysOffset(daysOffset + 1)}
            disabled={!canGoForward}
            className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
            title="Día siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => setDaysOffset(0)}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-medium whitespace-nowrap"
            title="Volver a hoy"
          >
            Hoy
          </button>
        </div>

        {/* Botón Refresh */}
        <button
          onClick={cargarReservas}
          className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-all flex-shrink-0"
          title="Actualizar ahora"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-blue-200 mt-4">Cargando reservas...</p>
        </div>
      )}

      {!loading && (
        <div className="flex-1 grid grid-cols-[69%_30%] gap-4 min-h-0">
          {/* Chromebooks - 70% */}
          <div className="flex flex-col bg-gray-900 rounded-xl overflow-hidden border border-blue-800">
            <h2 className="text-xl font-bold text-white p-4 bg-blue-900 border-b border-blue-800">Chromebooks</h2>
            <div className="flex-1 overflow-y-scroll scrollbar-hide">
              <table className="w-full">
                <thead className="sticky top-0 bg-blue-900 border-b border-blue-800">
                  <tr>
                    <th className="text-left text-xs font-semibold text-blue-200 p-3 w-24">Hora</th>
                    <th className="text-left text-xs font-semibold text-blue-200 p-3">Reservas</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((h, idx) => (
                    <tr key={h.bloque} className={`border-b border-gray-700 ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}>
                      <td className="p-3 text-xs font-semibold text-white w-24">
                        <div className="bg-blue-600 rounded-lg p-2 text-center whitespace-nowrap">
                          {h.inicio}-{h.fin}
                        </div>
                      </td>
                      <td className="p-2 min-h-[80px]">
                        <div className="flex flex-wrap gap-2 items-start content-start">
                          {chromebooksReservas[h.bloque]?.length === 0 ? (
                            <span className="text-gray-500 text-xs">Sin reservas</span>
                          ) : (
                            chromebooksReservas[h.bloque]?.map(reserva => (
                              <div
                                key={reserva.id}
                                className="bg-green-50 rounded-lg p-2 flex items-center gap-2 group hover:shadow-lg transition-all"
                              >
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-green-900">
                                    {reserva.usuarioNombre}
                                  </p>
                                  <p className="text-xs text-green-700">
                                    {reserva.curso} • {reserva.slots.length} carros
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleEliminarReserva(reserva.id)}
                                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tablets - 30% */}
          <div className="flex flex-col bg-gray-900 rounded-xl overflow-hidden border border-purple-800">
            <h2 className="text-xl font-bold text-white p-4 bg-purple-900 border-b border-purple-800">Tablets</h2>
            <div className="flex-1 overflow-y-scroll scrollbar-hide">
              <table className="w-full">
                <thead className="sticky top-0 bg-purple-900 border-b border-purple-800">
                  <tr>
                    <th className="text-left text-xs font-semibold text-purple-200 p-3 w-24">Hora</th>
                    <th className="text-left text-xs font-semibold text-purple-200 p-3">Reservas</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios.map((h, idx) => (
                    <tr key={h.bloque} className={`border-b border-gray-700 ${idx % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}`}>
                      <td className="p-3 text-xs font-semibold text-white w-24">
                        <div className="bg-purple-600 rounded-lg p-2 text-center whitespace-nowrap">
                          {h.inicio}-{h.fin}
                        </div>
                      </td>
                      <td className="p-2 min-h-[80px]">
                        <div className="flex flex-wrap gap-2 items-start content-start">
                          {tabletsReservas[h.bloque]?.length === 0 ? (
                            <span className="text-gray-500 text-xs">Sin reservas</span>
                          ) : (
                            tabletsReservas[h.bloque]?.map(reserva => (
                              <div
                                key={reserva.id}
                                className="bg-purple-100 rounded-lg p-2 flex items-center gap-2 group hover:shadow-lg transition-all"
                              >
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-purple-900">
                                    {reserva.usuarioNombre}
                                  </p>
                                  <p className="text-xs text-purple-700">
                                    {reserva.curso} • {reserva.slots.length} carros
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleEliminarReserva(reserva.id)}
                                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center text-blue-200 text-xs">
        <p>Última actualización: {ultimaCarga?.toLocaleTimeString('es-CL') || 'Cargando...'}</p>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}