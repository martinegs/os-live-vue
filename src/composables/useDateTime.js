/**
 * Composable para manejo de fechas con simulación
 * Configura SIMULATED_DATE para pruebas o null para fecha real
 * El chat siempre usa fecha real para evitar conflictos
 */

// ⚙️ CONFIGURACIÓN: Cambia esta fecha para simular otro día, o null para fecha real
let SIMULATED_DATE = null;

// Cargar fecha simulada desde localStorage al iniciar
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('simulated_date');
  if (stored && stored !== 'null') {
    SIMULATED_DATE = stored;
  }
}

// Funciones para controlar la simulación desde otros componentes
export function setSimulatedDate(dateString) {
  SIMULATED_DATE = dateString;
  if (typeof window !== 'undefined') {
    localStorage.setItem('simulated_date', dateString);
  }
}

export function clearSimulatedDate() {
  SIMULATED_DATE = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('simulated_date');
  }
}

export function getSimulatedDate() {
  return SIMULATED_DATE;
}

export function useDateTime(forceReal = false) {
  const getCurrentDate = () => {
    // Si forceReal es true (usado por chat), siempre devuelve fecha real
    if (forceReal || !SIMULATED_DATE) {
      return new Date();
    }
    return new Date(SIMULATED_DATE);
  };

  const getCurrentTimestamp = () => {
    return getCurrentDate().getTime();
  };

  const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = date || getCurrentDate();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  };

  const getDayName = (date) => {
    const d = date || getCurrentDate();
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[d.getDay()];
  };

  return {
    getCurrentDate,
    getCurrentTimestamp,
    formatDate,
    getDayName,
    isSimulated: !!SIMULATED_DATE && !forceReal
  };
}
