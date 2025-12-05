import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useProximasReservas } from '../hooks/useProximasReservas';
import { adminService } from '../services/admin.service';

export default function TabletPage() {
  const { proximasReservas, loading, cargarReservas, ultimaCarga } = useProximasReservas();
  const [daysOffset, setDaysOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Horarios normales (lunes, miércoles, jueves, viernes)
  const horariosNormales = [
    { inicio: '8:10', fin: '8:55', bloque: 0 },
    { inicio: '8:55', fin: '9:40', bloque: 1 },
    { inicio: '9:55', fin: '10:40', bloque: 2 },
    { inicio: '10:40', fin: '11:25', bloque: 3 },
    { inicio: '11:45', fin: '12:30', bloque: 4 },
    { inicio: '12:30', fin: '13:10', bloque: 5 },
    { inicio: '13:10', fin: '13:55', bloque: 6 },
    { inicio: '13:55', fin: '14:40', bloque: 7 },
    { inicio: '14:40', fin: '15:20', bloque: 8 },
    { inicio: '15:20', fin: '16:00', bloque: 9 }
  ];

  // Horario MARTES → solo hasta 13:50
  const horariosMartes = [
    { inicio: '8:10', fin: '8:55', bloque: 0 },
    { inicio: '8:55', fin: '9:40', bloque: 1 },
    { inicio: '9:55', fin: '10:40', bloque: 2 },
    { inicio: '10:40', fin: '11:25', bloque: 3 },
    { inicio: '11:40', fin: '12:25', bloque: 4 },
    { inicio: '12:25', fin: '13:10', bloque: 5 },
    { inicio: '13:10', fin: '13:50', bloque: 6 }
  ];

  // Horarios Tablets (1° a 3° Básico) - martes también solo hasta 13:50
  const horariosTabletsNormal = [
    { inicio: '8:10', fin: '8:55', bloque: 0 },
    { inicio: '8:55', fin: '9:40', bloque: 1 },
    { inicio: '9:55', fin: '10:40', bloque: 2 },
    { inicio: '10:40', fin: '11:25', bloque: 3 },
    { inicio: '11:25', fin: '12:10', bloque: 100 },
    { inicio: '12:55', fin: '13:35', bloque: 101 },
    { inicio: '13:35', fin: '14:20', bloque: 102 },
    { inicio: '14:40', fin: '15:20', bloque: 8 },
    { inicio: '15:20', fin: '16:00', bloque: 9 }
  ];

  const horariosTabletsMartes = [
    { inicio: '8:10', fin: '8:55', bloque: 0 },
    { inicio: '8:55', fin: '9:40', bloque: 1 },
    { inicio: '9:55', fin: '10:40', bloque: 2 },
    { inicio: '10:40', fin: '11:25', bloque: 3 },
    { inicio: '11:25', fin: '12:10', bloque: 100 },
    { inicio: '12:55', fin: '13:35', bloque: 101 },
    { inicio: '13:35', fin: '13:50', bloque: 102 } // termina aquí
  ];

  // Carga reservas
  useEffect(() => {
    cargarReservas();
    const interval = setInterval(cargarReservas, 300000);
    return () => clearInterval(interval);
  }, []);

  // Hora actual
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ¿Ya pasó las 17:30?
  const yaPaso1730 = () => {
    const h = currentTime.getHours();
    const m = currentTime.getMinutes();
    return h > 17 || (h === 17 && m >= 30);
  };

  // Al cargar → saltar al próximo día hábil si ya pasó 17:30
  useEffect(() => {
    if (!yaPaso1730()) {
      setDaysOffset(0);
      return;
    }
    const hoyDiaSemana = currentTime.getDay();
    const offset = hoyDiaSemana === 5 ? 3 : 1;
    setDaysOffset(offset);
  }, []);

  // Fecha seleccionada (solo días hábiles)
  const getSelectedDate = () => {
    const base = new Date(currentTime);
    base.setHours(0, 0, 0, 0);

    let offset = daysOffset;
    let steps = Math.abs(offset);
    const direction = offset >= 0 ? 1 : -1;

    while (steps > 0) {
      base.setDate(base.getDate() + direction);
      const dw = base.getDay();
      if (dw !== 0 && dw !== 6) steps--;
    }
    return base;
  };

  const selectedDate = getSelectedDate();
  const esMartes = selectedDate.getDay() === 2;

  // Horarios según el día
  const horariosChromebooks = esMartes ? horariosMartes : horariosNormales;
  const horariosTablets = esMartes ? horariosTabletsMartes : horariosTabletsNormal;

  // Header y navegación
  const formatHeaderDate = () => {
    const dayName = selectedDate.toLocaleDateString('es-CL', { weekday: 'long' })
      .replace(/^\w/, c => c.toUpperCase());
    const time = currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    return `${dayName} - Hora ${time}`;
  };

  const getNavigationDateLabel = () => {
    const day = selectedDate.getDate();
    const month = selectedDate.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '');
    const year = selectedDate.getFullYear();

    const hoyReal = new Date();
    hoyReal.setHours(0, 0, 0, 0);
    const esHoyReal = selectedDate.getTime() === hoyReal.getTime();

    return (
      <span className={esHoyReal ? 'text-indigo-600 font-bold' : 'text-gray-800'}>
        {day} de {month} {year}
        {esHoyReal && ' ← Hoy'}
      </span>
    );
  };

  const getSelectedDateStr = () => selectedDate.toISOString().split('T')[0];

  const obtenerReservasPorBloque = (tipoEquipo, fechaStr, horariosLista) => {
    const reservas = tipoEquipo === 'chromebook' ? proximasReservas.chromebook : proximasReservas.tablet;
    const agrupadas = {};
    horariosLista.forEach(h => { agrupadas[h.bloque] = []; });

    reservas.forEach(reserva => {
      if (reserva.fechaStr !== fechaStr) return;
      reserva.slots.forEach(slot => {
        if (horariosLista.some(h => h.bloque === slot.bloque)) {
          if (!agrupadas[slot.bloque]?.find(r => r.id === reserva.id)) {
            agrupadas[slot.bloque].push(reserva);
          }
        }
      });
    });
    return agrupadas;
  };

  const selectedDateStr = getSelectedDateStr();
  const chromebooksReservas = obtenerReservasPorBloque('chromebook', selectedDateStr, horariosChromebooks);
  const tabletsReservas = obtenerReservasPorBloque('tablet', selectedDateStr, horariosTablets);

  const handlePrev = () => setDaysOffset(o => o - 1);
  const handleNext = () => setDaysOffset(o => o + 1);
  const handleVolverHoy = () => setDaysOffset(0);

  const formatearNombre = (nombre) => {
    if (!nombre) return '';
    const partes = nombre.trim().split(' ');
    const primerNombre = partes[0];
    const primerApellido = partes.slice(1).find(p => p[0] === p[0].toUpperCase() && p.length > 2) || partes[1] || '';
    return `${primerNombre} ${primerApellido}`.trim();
  };

  const handleEliminarReserva = async (id) => {
    if (confirm('¿Eliminar esta reserva?')) {
      await adminService.eliminarReserva(id);
      cargarReservas();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-800">Sistema de Reservas de Equipos</h1>
          <p className="text-gray-600 text-sm mt-1">{formatHeaderDate()}</p>
        </div>

        <div className="flex items-center justify-center gap-3 flex-shrink-0">

          {/* BOTÓN HOME AGREGADO AQUÍ */}
          <button onClick={() => (window.location.href = '/')}
            className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-all">
            <Home className="w-5 h-5 text-gray-700" />
          </button>

          <button onClick={handlePrev}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[180px]">
            <p className="font-semibold text-sm leading-tight">
              {getNavigationDateLabel()}
            </p>
          </div>

          <button onClick={handleNext}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>

          <button onClick={handleVolverHoy}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all text-sm font-medium">
            {yaPaso1730() ? 'Volver al día actual' : 'Hoy'}
          </button>
        </div>

        <button onClick={cargarReservas}
          className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex-shrink-0">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Cargando reservas...</p>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-[69%_30%] gap-4 min-h-0">

          {/* Chromebooks */}
          <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">Chromebooks</h2>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 p-3 w-24">Hora</th>
                    <th className="text-left text-xs font-semibold text-gray-600 p-3">Reservas</th>
                  </tr>
                </thead>
                <tbody>
                  {horariosChromebooks.map((h, idx) => (
                    <tr key={h.bloque} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-3 text-xs font-semibold text-gray-800 w-24">
                        <div className="rounded-lg p-2 text-center whitespace-nowrap text-xs bg-blue-100 text-blue-800">
                          {h.inicio}-{h.fin}
                        </div>
                      </td>
                      <td className="p-2 min-h-[80px]">
                        <div className="flex flex-wrap gap-2">
                          {chromebooksReservas[h.bloque]?.length === 0 ? (
                            <span className="text-gray-500 text-xs">Sin reservas</span>
                          ) : (
                            chromebooksReservas[h.bloque]?.map(r => (
                              <div key={r.id} className="bg-green-50 rounded-lg p-2 flex items-center gap-2 group hover:shadow-md transition-all border border-green-200">
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-green-900">{formatearNombre(r.usuarioNombre)}</p>
                                  <p className="text-xs text-green-700">{r.curso} • {r.slots.length} carros</p>
                                </div>
                                <button onClick={() => handleEliminarReserva(r.id)}
                                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
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

          {/* Tablets */}
          <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">Tablets</h2>
            <div className="flex-1 overflow-y-auto scrollbar-hide">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-600 p-3 w-24">Hora</th>
                    <th className="text-left text-xs font-semibold text-gray-600 p-3">Reservas</th>
                  </tr>
                </thead>
                <tbody>
                  {horariosTablets.map((h, idx) => (
                    <tr key={h.bloque} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="p-3 text-xs font-semibold text-gray-800 w-24">
                        <div className="bg-purple-100 text-purple-800 rounded-lg p-2 text-center whitespace-nowrap text-xs">
                          {h.inicio}-{h.fin}
                        </div>
                      </td>
                      <td className="p-2 min-h-[80px]">
                        <div className="flex flex-wrap gap-2">
                          {tabletsReservas[h.bloque]?.length === 0 ? (
                            <span className="text-gray-500 text-xs">Sin reservas</span>
                          ) : (
                            tabletsReservas[h.bloque]?.map(r => (
                              <div key={r.id} className="bg-purple-50 rounded-lg p-2 flex items-center gap-2 group hover:shadow-md transition-all border border-purple-200">
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-purple-900">{formatearNombre(r.usuarioNombre)}</p>
                                  <p className="text-xs text-purple-700">{r.curso} • {r.slots.length} carros</p>
                                </div>
                                <button onClick={() => handleEliminarReserva(r.id)}
                                  className="p-1 bg-red-500 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity">
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

      <div className="mt-4 text-center text-gray-600 text-xs">
        <p>Última actualización: {ultimaCarga?.toLocaleTimeString('es-CL') || 'Cargando...'}</p>
      </div>

      <style jsx>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
