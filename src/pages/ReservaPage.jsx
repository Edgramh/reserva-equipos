import { useState, useEffect } from 'react';
import { Calendar, Clock, List, Laptop, Tablet, BookOpen, AlertTriangle, Check, ChevronDown, Shield, X, Circle, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from "../hooks/useAuth";
import { useReservas } from "../hooks/useReservas";
import { reservasService } from "../services/reservas.service";
import { isAdmin } from '../utils/adminUsers';
import { useNavigate } from 'react-router-dom';

const CURSOS = {
  basico: ['1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C', '3ro A', '3ro B', '4to A', '4to B', '5to A', '5to B', '6to A', '6to B'],
  mayor: ['7mo A', '7mo B', '8vo A', '8vo B', 'I Medio A', 'I Medio B', 'II Medio A', 'II Medio B', 'III Medio A', 'IV Medio A']
};

const CURSOS_TABLETS = ['1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C'];

const HORARIOS = {
  '1ro-3ro': [
    { inicio: '8:10', fin: '8:55' }, { inicio: '8:55', fin: '9:40' }, { inicio: '9:55', fin: '10:40' }, { inicio: '10:40', fin: '11:25' },
    { inicio: '11:25', fin: '12:10' }, { inicio: '12:55', fin: '13:35' }, { inicio: '13:35', fin: '14:20' }, { inicio: '14:40', fin: '15:20' }, { inicio: '15:20', fin: '16:00' }
  ],
  '4to-6to': [
    { inicio: '8:10', fin: '8:55' }, { inicio: '8:55', fin: '9:40' }, { inicio: '9:55', fin: '10:40' }, { inicio: '10:40', fin: '11:25' },
    { inicio: '11:45', fin: '12:30' }, { inicio: '12:30', fin: '13:10' }, { inicio: '13:55', fin: '14:40' }, { inicio: '14:40', fin: '15:20' }, { inicio: '15:20', fin: '16:00' }
  ],
  '7mo-IVMedio': [
    { inicio: '8:10', fin: '8:55' }, { inicio: '8:55', fin: '9:40' }, { inicio: '9:55', fin: '10:40' }, { inicio: '10:40', fin: '11:25' },
    { inicio: '11:45', fin: '12:30' }, { inicio: '12:30', fin: '13:10' }, { inicio: '13:10', fin: '13:55' }, { inicio: '14:40', fin: '15:20' }, { inicio: '15:20', fin: '16:00' }
  ],
  'martes': [
    { inicio: '8:10', fin: '8:55' }, { inicio: '8:55', fin: '9:40' }, { inicio: '9:55', fin: '10:40' }, { inicio: '10:40', fin: '11:25' },
    { inicio: '11:40', fin: '12:25' }, { inicio: '12:25', fin: '13:10' }, { inicio: '13:10', fin: '13:50' }
  ]
};

const getGrupoHorario = (curso) => {
  if (['1ro A', '1ro B', '1ro C', '2do A', '2do B', '2do C', '3ro A', '3ro B'].includes(curso)) return '1ro-3ro';
  if (['4to A', '4to B', '5to A', '5to B', '6to A', '6to B'].includes(curso)) return '4to-6to';
  return '7mo-IVMedio';
};

const getCiclo = (curso) => CURSOS.basico.includes(curso) ? 'Ciclo Básico' : 'Ciclo Mayor';
const usaTablets = (curso) => CURSOS_TABLETS.includes(curso);

// NUEVA FUNCIÓN: decide qué bloque guardar en la base de datos
const obtenerBloqueReal = (bloqueOriginal, curso, fechaStr) => {
  const fecha = new Date(fechaStr);
  const diaSemana = fecha.getDay(); // 0=domingo, 1=lunes, 2=martes...
  const esMartes = diaSemana === 2;
  const esCursoMedio = CURSOS.mayor.includes(curso);

  if (esMartes) {
    return bloqueOriginal; // martes → bloques normales
  }

  if (esCursoMedio) {
    if (bloqueOriginal === 6) return 60; // 13:10–13:55 solo medios
    if (bloqueOriginal === 7) return 70; // 13:55–14:40 solo medios
  }

  return bloqueOriginal; // 4to-6to y 1ro-3ro usan bloques normales
};

const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
};

const getDayOfWeek = (dateStr) => new Date(dateStr + 'T12:00:00').getDay();

const getLastBlockEndTime = (horarios) => {
  if (horarios.length === 0) return 0;
  const lastBlock = horarios[horarios.length - 1];
  return timeToMinutes(lastBlock.fin);
};

const isDayPassed = (dateStr, currentTime) => {
  const dayDate = new Date(dateStr + 'T12:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dayDate.setHours(0, 0, 0, 0);

  if (dayDate.getTime() === today.getTime()) {
    const dow = getDayOfWeek(dateStr);
    const horarios = dow === 2 ? HORARIOS['martes'] : HORARIOS['1ro-3ro'];
    const lastBlockEndTime = getLastBlockEndTime(horarios);
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    return now >= lastBlockEndTime;
  }

  return dayDate < today;
};

export default function ReservaPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    curso: '',
    fecha: new Date().toISOString().split('T')[0],
    selectedSlots: [],
    ultimaHora: false,
    justificacion: '',
    aceptaTerminos: false
  });

  const { reservas: reservasExistentes } = useReservas(formData.fecha, formData.curso) || { reservas: [] };

  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getAvailableDates = () => {
    const dates = [];
    for (let i = 0; i <= 7; i++) {
      const d = new Date(currentTime);
      d.setDate(currentTime.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const dow = d.getDay();

      if (dow !== 0 && dow !== 6 && !isDayPassed(ds, currentTime)) {
        dates.push(ds);
      }
    }
    return dates;
  };

  useEffect(() => {
    const availableDates = getAvailableDates();
    if (availableDates.length > 0 && !formData.fecha) {
      setFormData(prev => ({ ...prev, fecha: availableDates[0] }));
    }
  }, [currentTime]);

  const getTodayString = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  };

  const todayString = getTodayString();
  const isToday = formData.fecha === todayString;

  const getDayOfWeekForDate = (dateStr) => new Date(dateStr + 'T12:00:00').getDay();

const getHorarios = () => {
  if (!formData.curso || !formData.fecha) return [];

  const dow = getDayOfWeekForDate(formData.fecha);
  const esMartes = dow === 2; // martes
  const esBasico46 = ['4to A', '4to B', '5to A', '5to B', '6to A', '6to B'].includes(formData.curso);
  const esMedio = ['7mo A', '7mo B', '8vo A', '8vo B', 'I Medio A', 'I Medio B', 'II Medio A', 'II Medio B', 'III Medio A', 'IV Medio A'].includes(formData.curso);

  // MARTES → horario especial de solo 7 bloques
  if (esMartes) {
    return [
      { bloque: 0, inicio: '8:10', fin: '8:55' },
      { bloque: 1, inicio: '8:55', fin: '9:40' },
      { bloque: 2, inicio: '9:55', fin: '10:40' },
      { bloque: 3, inicio: '10:40', fin: '11:25' },
      { bloque: 4, inicio: '11:40', fin: '12:25' },
      { bloque: 5, inicio: '12:25', fin: '13:10' },
      { bloque: 6, inicio: '13:10', fin: '13:50' }
    ];
  }

  // Días normales → 10 bloques con bloqueos por curso
  return [
    { bloque: 0, inicio: '8:10', fin: '8:55' },
    { bloque: 1, inicio: '8:55', fin: '9:40' },
    { bloque: 2, inicio: '9:55', fin: '10:40' },
    { bloque: 3, inicio: '10:40', fin: '11:25' },
    { bloque: 4, inicio: '11:45', fin: '12:30' },
    { bloque: 5, inicio: '12:30', fin: '13:10' },
    { bloque: 6, inicio: '13:10', fin: '13:55', disabled: esBasico46 },
    { bloque: 7, inicio: '13:55', fin: '14:40', disabled: esMedio },
    { bloque: 8, inicio: '14:40', fin: '15:20' },
    { bloque: 9, inicio: '15:20', fin: '16:00' }
  ];
};

const isBloquePassedTime = (bloque) => {
  if (!isToday) return false;
  const now = currentTime.getHours() * 60 + currentTime.getMinutes();
  const finBloque = timeToMinutes(bloque.fin);
  return now > finBloque;
};

// REEMPLAZA COMPLETAMENTE esta función:
const getCarrosDisponibles = (bloqueIdx) => {
  const esTab = usaTablets(formData.curso);
  const total = esTab ? 3 : 10;
  const tipo = esTab ? 'tablet' : 'chromebook';
  
  const diaSemana = new Date(formData.fecha).getDay(); // ¡NUEVO!
  const esMartes = diaSemana === 2; // martes

  const reservados = reservasExistentes
    .filter(r => r.fechaStr === formData.fecha && r.tipoEquipo === tipo)
    .flatMap(r => r.slots
      .filter(s => {
        const bloqueGuardado = s.bloque;

        // Si es martes → todos usan bloques normales (6 y 7)
        if (esMartes) {
          return bloqueGuardado === bloqueIdx;
        }

        // Si NO es martes:
        // - Para bloque 6: solo se ocupa si alguien reservó 60 (medios)
        if (bloqueIdx === 6) return bloqueGuardado === 60;
        // - Para bloque 7: se ocupa si alguien reservó 70 (medios) o 7 (básicos)
        if (bloqueIdx === 7) return bloqueGuardado === 70 || bloqueGuardado === 7;

        // Resto de bloques: comparación normal
        return bloqueGuardado === bloqueIdx;
      })
      .map(s => s.carro)
    );
  
  return Array.from({ length: total }, (_, i) => i + 1).filter(c => !reservados.includes(c));
};

  const isSlotSelected = (b, c) => formData.selectedSlots.some(s => s.bloque === b && s.carro === c);

  const toggleSlot = (bloqueIdx, carro) => {
    const exists = formData.selectedSlots.find(s => s.bloque === bloqueIdx && s.carro === carro);
    if (exists) {
      setFormData({
        ...formData,
        selectedSlots: formData.selectedSlots.filter(s => !(s.bloque === bloqueIdx && s.carro === carro))
      });
    } else {
      const bloques = [...new Set(formData.selectedSlots.map(s => s.bloque))];
      if (!bloques.includes(bloqueIdx) && bloques.length >= 2) {
        setErrors({ ...errors, slots: 'Máximo 2 horas simultáneas' });
        return;
      }
      const max = usaTablets(formData.curso) ? 3 : 4;
      if (formData.selectedSlots.filter(s => s.bloque === bloqueIdx).length >= max) {
        setErrors({ ...errors, slots: `Máximo ${max} carros por reserva de hora` });
        return;
      }
      setErrors({ ...errors, slots: null });
      setFormData({
        ...formData,
        selectedSlots: [...formData.selectedSlots, { bloque: bloqueIdx, carro }]
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSubmit = async () => {
    const err = {};
    if (!formData.curso) err.curso = 'Selecciona un curso';
    if (formData.selectedSlots.length === 0) err.slots = 'Selecciona al menos un bloque horario';
    if (!formData.aceptaTerminos) err.terminos = 'Debes aceptar los términos y condiciones';
    if (formData.ultimaHora && !formData.justificacion.trim()) err.justificacion = 'Ingresa una justificación';
    
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    try {
      const reservaData = {
        curso: formData.curso,
        ciclo: getCiclo(formData.curso),
        tipoEquipo: usaTablets(formData.curso) ? 'tablet' : 'chromebook',
        fecha: new Date(formData.fecha),
        fechaStr: formData.fecha,
        slots: formData.selectedSlots.map(slot => ({
          bloque: obtenerBloqueReal(slot.bloque, formData.curso, formData.fecha),
          carro: slot.carro,
          horaInicio: getHorarios()[slot.bloque].inicio,
          horaFin: getHorarios()[slot.bloque].fin
        })),
        ultimaHora: formData.ultimaHora,
        justificacion: formData.justificacion,
        aceptaTerminos: formData.aceptaTerminos
      };

      await reservasService.crearReserva(reservaData, user);

      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
        setFormData({
          curso: '',
          fecha: new Date().toISOString().split('T')[0],
          selectedSlots: [],
          ultimaHora: false,
          justificacion: '',
          aceptaTerminos: false
        });
      }, 10000);
    } catch (error) {
      console.error('Error al crear reserva:', error);
      setErrors({ submit: 'Error al crear la reserva. Intenta de nuevo.' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Laptop className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Reserva de Equipos</h1>
            <p className="text-gray-500 mt-2">Colegio Mariano de Schoenstatt</p>
          </div>
          <button
            onClick={() => {/* tu login con Google */}}
            className="w-full bg-white border-2 border-gray-200 rounded-xl py-3 px-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all shadow-sm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-medium text-gray-700">Iniciar sesión con Google</span>
          </button>
          <p className="text-xs text-gray-400 text-center mt-4">Solo cuentas @colegiomariano.cl</p>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Reserva Confirmada!</h2>
          <p className="text-gray-500 mb-6">Recibirás un correo de confirmación y un recordatorio 15 min antes.</p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left text-sm text-gray-600">
            <p className="mb-1"><span className="font-medium">Curso:</span> {formData.curso}</p>
            <p className="mb-1"><span className="font-medium">Fecha:</span> {formatDate(formData.fecha)}</p>
            <p className="mb-1"><span className="font-medium">Ciclo:</span> {getCiclo(formData.curso)}</p>
            <p><span className="font-medium">Equipos:</span> {usaTablets(formData.curso) ? 'Tablets' : 'Chromebooks'}</p>
          </div>
          <button
            onClick={() => {
              setShowSuccess(false);
              setFormData({ ...formData, selectedSlots: [], ultimaHora: false, justificacion: '', aceptaTerminos: false });
            }}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-3 font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
          >
            Nueva Reserva
          </button>
        </div>
      </div>
    );
  }

  const horarios = getHorarios();
  const esTablet = formData.curso ? usaTablets(formData.curso) : false;
  const numCarros = esTablet ? 3 : 10;
  const availableDates = getAvailableDates();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 xl:px-16 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Laptop className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Reserva de Equipos</h1>
              <p className="text-xs text-gray-500">Colegio Mariano de Schoenstatt</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {isAdmin(user.email) && (
                <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-indigo-600 transition-all" title="Panel Administrador">
                  <Shield className="w-5 h-5" />
                </button>
              )}
              {/* Botón Calendario - Solo visible para ADMINS */}
              {isAdmin(user.email) && (
                <button
                  onClick={() => navigate('/tablet')}
                  className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
                  title="Ver el calendario de reservas"
                >
                  <Calendar className="w-5 h-5" />
                  <span className="text-xs font-medium hidden sm:inline">Calendario</span>
                </button>
              )}
                  <button
                  onClick={() => navigate('/mis-reservas')}
                  className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all flex items-center gap-1.5"
                  title="Ver mis reservas activas"
                >
                  <List className="w-5 h-5" />
                  <span className="text-xs font-medium hidden sm:inline">Mis Reservas</span>
                </button>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0)}
              </div>
              <span className="text-sm text-gray-700 hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 xl:px-16 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-72 xl:w-80 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                Datos de la Reserva
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Curso</label>
                  <div className="relative">
                    <select
                      value={formData.curso}
                      onChange={(e) => setFormData({ ...formData, curso: e.target.value, selectedSlots: [] })}
                      className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-indigo-400 focus:bg-white"
                    >
                      <option value="">Selecciona un curso</option>
                      <optgroup label="Ciclo Básico">
                        {CURSOS.basico.map(c => (<option key={c} value={c}>{c}</option>))}
                      </optgroup>
                      <optgroup label="Ciclo Mayor">
                        {CURSOS.mayor.map(c => (<option key={c} value={c}>{c}</option>))}
                      </optgroup>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {formData.curso && (
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl px-3 py-2 border border-indigo-100">
                      <p className="text-xs text-gray-500">Ciclo</p>
                      <p className="font-semibold text-indigo-700 text-sm">{getCiclo(formData.curso)}</p>
                    </div>
                    <div className="flex-1 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl px-3 py-2 border border-blue-100">
                      <p className="text-xs text-gray-500">Equipos</p>
                      <p className="font-semibold text-blue-700 text-sm flex items-center gap-1">
                        {esTablet ? <Tablet className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                        {esTablet ? 'Tablets' : 'Chromebooks'}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fecha ({availableDates.length} días disponibles)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {availableDates.map(ds => (
                      <button
                        key={ds}
                        onClick={() => setFormData({ ...formData, fecha: ds, selectedSlots: [] })}
                        className={`p-2 rounded-xl text-xs font-medium transition-all ${
                          formData.fecha === ds
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-100'
                        }`}
                      >
                        {new Date(ds + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' })}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.ultimaHora}
                      onChange={(e) => setFormData({ ...formData, ultimaHora: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        Reserva de Última Hora
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Marca esta opción si tu reserva es fuera del plazo mínimo</p>
                    </div>
                  </label>
                </div>

                {formData.ultimaHora && (
                  <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                    <label className="block text-sm font-medium text-orange-800 mb-1.5">Justificación *</label>
                    <textarea
                      value={formData.justificacion}
                      onChange={(e) => setFormData({ ...formData, justificacion: e.target.value })}
                      placeholder="Explica por qué necesitas esta reserva..."
                      className="w-full bg-white border border-orange-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
                      rows={3}
                    />
                    {errors.justificacion && <p className="text-red-500 text-xs mt-1">{errors.justificacion}</p>}
                  </div>
                )}

                <div className="border-t border-gray-100 pt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.aceptaTerminos}
                      onChange={(e) => setFormData({ ...formData, aceptaTerminos: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-gray-600 leading-relaxed">
                      Acepto retirar personalmente los equipos reservados, contabilizarlos, firmar el registro y devolverlos al terminar su uso.
                    </span>
                  </label>
                  {errors.terminos && <p className="text-red-500 text-xs mt-1">{errors.terminos}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  <span>Disponibilidad para:</span>
                  <span className="text-indigo-600">{formatDate(formData.fecha)}</span>
                </h2>
                {formData.selectedSlots.length > 0 && (
                  <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                    {formData.selectedSlots.length} seleccionado{formData.selectedSlots.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {!formData.curso ? (
                <div className="text-center py-16 text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p className="text-lg">Selecciona un curso para ver la disponibilidad</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-xs font-semibold text-gray-500 pb-3 pr-2 w-24">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Hora
                          </th>
                          {Array.from({ length: numCarros }, (_, i) => (
                            <th key={i} className="text-center text-xs font-semibold text-gray-500 pb-3 px-0.5">
                              <div className="flex flex-col items-center gap-0.5">
                                {esTablet ? <Tablet className="w-3.5 h-3.5 text-gray-400" /> : <Laptop className="w-3.5 h-3.5 text-gray-400" />}
                                <span>{esTablet ? `T-0${i + 1}` : `C-${String(i + 1).padStart(2, '0')}`}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {horarios.map((h, bIdx) => {
                          const disp = getCarrosDisponibles(bIdx);
                          const isPast = isBloquePassedTime(h);
                          const isDisabled = h.disabled || false;

                          return (
                            <tr 
                              key={bIdx} 
                              className={`border-t border-gray-100 ${isPast || isDisabled ? 'opacity-40' : ''}`}
                            >
                              <td className="py-1 pr-2">
                                <div className={`rounded-lg px-2 py-1 text-xs text-center font-medium ${
                                  isPast || isDisabled
                                    ? 'bg-gray-200 text-gray-500 line-through'
                                    : 'bg-gray-50 text-gray-700'
                                }`}>
                                  <span>{h.inicio}</span>
                                  <span className="text-gray-400 mx-0.5">-</span>
                                  <span>{h.fin}</span>
                                  {isDisabled}
                                </div>
                              </td>
                              {Array.from({ length: numCarros }, (_, cIdx) => {
                                const cNum = cIdx + 1;
                                const ok = disp.includes(cNum) && !isPast && !isDisabled;
                                const sel = isSlotSelected(bIdx, cNum);

                                return (
                                  <td key={cIdx} className="py-1 px-0.5">
                                    <button
                                      onClick={() => ok && toggleSlot(bIdx, cNum)}
                                      disabled={!ok}
                                      className={`w-full h-7 rounded-lg transition-all flex items-center justify-center ${
                                        isDisabled || isPast
                                          ? 'bg-gray-100 border border-gray-300 cursor-not-allowed'
                                          : sel
                                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md scale-105'
                                          : ok
                                          ? 'bg-green-50 hover:bg-green-100 border border-green-300'
                                          : 'bg-red-50 border border-red-200 cursor-not-allowed'
                                      }`}
                                    >
                                      {isDisabled || isPast ? <X className="w-3 h-3 text-gray-400" /> :
                                      sel ? <Check className="w-3.5 h-3.5" /> :
                                      ok ? <Circle className="w-3 h-3 text-green-500" /> :
                                      <X className="w-3 h-3 text-red-300" />}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {errors.slots && (
                    <div className="mt-3 bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm">
                      {errors.slots}
                    </div>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!formData.curso || formData.selectedSlots.length === 0}
                    className="w-full mt-5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl py-3 font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirmar Reserva
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}