/**
 * Servicio de SSE unificado para evitar múltiples conexiones
 * Solo mantiene UNA conexión EventSource compartida por toda la app
 */

let eventSource = null;
let listeners = new Map(); // { eventType: Set<callback> }
let connectionStatus = 'disconnected';
let reconnectAttempts = 0;
let reconnectTimer = null;

const API_BASE = import.meta.env.VITE_API_ORIGIN || 'http://localhost:4000';

/**
 * Conectar al servidor SSE (solo si no está ya conectado)
 */
export function connect(userId = null) {
  if (eventSource && eventSource.readyState !== EventSource.CLOSED) {
    console.log('[RealtimeService] Ya conectado');
    return;
  }

  const url = `${API_BASE}/realtime/stream?channel=all${userId ? `&userId=${userId}` : ''}`;

  console.log('[RealtimeService] Conectando a:', url);
  
  try {
    eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      console.log('[RealtimeService] ✅ Conexión SSE establecida');
      connectionStatus = 'connected';
      reconnectAttempts = 0;
      
      // Notificar a listeners de conexión
      notifyListeners('connected', { status: 'connected' });
    };
    
    eventSource.onerror = (error) => {
      console.error('[RealtimeService] ❌ Error SSE:', error);
      connectionStatus = 'error';
      
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('[RealtimeService] Conexión cerrada, intentando reconectar...');
        scheduleReconnect(userId);
      }
      
      notifyListeners('error', { error });
    };
    
    // Eventos del servidor
    eventSource.addEventListener('connected', handleConnected);
    eventSource.addEventListener('os:new', handleEvent);
    eventSource.addEventListener('os:update', handleEvent);
    eventSource.addEventListener('os:delete', handleEvent);
    eventSource.addEventListener('chat:message', handleEvent);
    eventSource.addEventListener('chat:read', handleEvent);
    
  } catch (error) {
    console.error('[RealtimeService] Error al crear EventSource:', error);
    scheduleReconnect(userId);
  }
}

/**
 * Desconectar del servidor SSE
 */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  
  if (eventSource) {
    console.log('[RealtimeService] Desconectando...');
    eventSource.close();
    eventSource = null;
    connectionStatus = 'disconnected';
  }
  
  // Limpiar listeners
  listeners.clear();
}

/**
 * Registrar un listener para un tipo de evento
 */
export function on(eventType, callback) {
  if (!listeners.has(eventType)) {
    listeners.set(eventType, new Set());
  }
  listeners.get(eventType).add(callback);
  
  console.log('[RealtimeService] Listener registrado:', eventType);
}

/**
 * Eliminar un listener
 */
export function off(eventType, callback) {
  if (listeners.has(eventType)) {
    listeners.get(eventType).delete(callback);
  }
}

/**
 * Obtener estado de conexión
 */
export function getStatus() {
  return connectionStatus;
}

// ============ FUNCIONES INTERNAS ============

function handleConnected(event) {
  const data = JSON.parse(event.data);
  console.log('[RealtimeService] Conectado:', data);
}

function handleEvent(event) {
  const eventType = event.type;
  const data = JSON.parse(event.data);
  
  console.log('[RealtimeService] Evento recibido:', eventType, data);
  notifyListeners(eventType, data);
}

function notifyListeners(eventType, data) {
  if (listeners.has(eventType)) {
    listeners.get(eventType).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('[RealtimeService] Error en listener:', error);
      }
    });
  }
}

function scheduleReconnect(userId) {
  if (reconnectTimer) return;
  
  reconnectAttempts++;
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
  
  console.log(`[RealtimeService] Reconectando en ${delay}ms (intento ${reconnectAttempts})`);
  
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect(userId);
  }, delay);
}
