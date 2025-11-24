/**
 * Configuración de rendimiento para dispositivos de bajos recursos
 * Detecta automáticamente las capacidades del dispositivo y ajusta las animaciones
 */

// Detectar si el dispositivo tiene recursos limitados
export function isLowEndDevice() {
  // Verificar número de núcleos (menos de 4 = bajo rendimiento)
  const cores = navigator.hardwareConcurrency || 4;
  
  // Verificar memoria (menos de 4GB = bajo rendimiento)
  const memory = navigator.deviceMemory || 4;
  
  // Verificar si prefiere movimiento reducido
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  return cores < 4 || memory < 4 || prefersReducedMotion;
}

// Aplicar optimizaciones si es necesario
export function applyPerformanceOptimizations() {
  if (isLowEndDevice()) {
    console.info('[Performance] Dispositivo de bajos recursos detectado - Aplicando optimizaciones');
    
    // Reducir duración de animaciones
    document.documentElement.style.setProperty('--animation-duration-multiplier', '2');
    
    // Añadir clase para CSS
    document.documentElement.classList.add('low-end-device');
    
    return true;
  }
  
  console.info('[Performance] Dispositivo de alto rendimiento - Usando animaciones completas');
  return false;
}

// Configuración de intervalos según rendimiento
export function getPollingInterval() {
  return isLowEndDevice() ? 10000 : 5000; // 10s vs 5s
}

export function getAnimationDuration() {
  return isLowEndDevice() ? 'slow' : 'normal';
}
