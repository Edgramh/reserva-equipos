import { CURSOS, CURSOS_TABLETS } from './constants';

export const getGrupoHorario = (curso) => {
  if (['1ro A','1ro B','1ro C','2do A','2do B','2do C','3ro A','3ro B'].includes(curso)) return '1ro-3ro';
  if (['4to A','4to B','5to A','5to B','6to A','6to B'].includes(curso)) return '4to-6to';
  return '7mo-IVMedio';
};

export const getCiclo = (curso) => CURSOS.basico.includes(curso) ? 'Ciclo Básico' : 'Ciclo Mayor';

export const usaTablets = (curso) => CURSOS_TABLETS.includes(curso);

export const timeToMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
};

export const getDayOfWeek = (dateStr) => new Date(dateStr + 'T12:00:00').getDay();