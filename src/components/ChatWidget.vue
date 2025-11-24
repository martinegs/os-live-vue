<template>
  <div class="chat-widget" :class="{ 'chat-widget--open': isOpen, 'chat-widget--minimized': isMinimized }">
    <!-- Botón flotante para abrir el chat -->
    <button 
      v-if="!isOpen" 
      class="chat-widget__trigger" 
      @click="toggleChat"
      :class="{ 'chat-widget__trigger--unread': totalUnread > 0 }"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span v-if="totalUnread > 0" class="chat-widget__badge">{{ totalUnread }}</span>
    </button>

    <!-- Ventana del chat -->
    <div v-if="isOpen" class="chat-widget__window">
      <!-- Header -->
      <div class="chat-widget__header">
        <h3 class="chat-widget__title">
          <span v-if="!currentConversation">Mensajes</span>
          <button 
            v-else 
            class="chat-widget__back"
            @click="closeConversation"
          >
            ←
          </button>
          <span v-if="currentConversation">{{ currentConversation.user_name }}</span>
          <span v-if="isPolling" class="chat-widget__polling-indicator" title="Actualizando mensajes...">
            <svg class="chat-widget__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2 A10 10 0 0 1 22 12" stroke-linecap="round"/>
            </svg>
          </span>
        </h3>
        <div class="chat-widget__header-actions">
          <button @click="toggleMinimize" class="chat-widget__action-btn" title="Minimizar">
            _
          </button>
          <button @click="toggleChat" class="chat-widget__action-btn" title="Cerrar">
            ×
          </button>
        </div>
      </div>

      <!-- Contenido -->
      <div v-if="!isMinimized" class="chat-widget__content">
        <!-- Lista de conversaciones -->
        <div v-if="!currentConversation" class="chat-widget__conversations">
          <!-- Búsqueda de usuarios -->
          <div class="chat-widget__search">
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Buscar usuario..."
              @input="onSearchInput"
              class="chat-widget__search-input"
            >
          </div>

          <!-- Resultados de búsqueda -->
          <div v-if="searchQuery && searchResults.length > 0" class="chat-widget__search-results">
            <div 
              v-for="user in searchResults"
              :key="user.id"
              class="chat-widget__user-item"
              @click="startConversation(user)"
            >
              <div class="chat-widget__user-avatar">
                {{ getInitials(user.nombre) }}
              </div>
              <div class="chat-widget__user-info">
                <div class="chat-widget__user-name">{{ user.nombre }}</div>
                <div class="chat-widget__user-email">{{ user.email }}</div>
              </div>
            </div>
          </div>

          <!-- Lista de conversaciones existentes -->
          <div v-else class="chat-widget__conversation-list">
            <!-- Mostrar todos los usuarios primero -->
            <div 
              v-if="allUsers.length === 0 && conversations.length === 0"
              class="chat-widget__empty"
            >
              No hay usuarios disponibles.
            </div>
            
            <!-- Sección de todos los usuarios -->
            <div v-if="allUsers.length > 0" class="chat-widget__section">
              <div class="chat-widget__section-title">Todos los usuarios</div>
              <div 
                v-for="user in allUsers"
                :key="'user-' + user.id"
                class="chat-widget__conversation-item"
                :class="{ 'chat-widget__conversation-item--unread': user.unread_count > 0 }"
                @click="openUserConversation(user)"
              >
                <div class="chat-widget__user-avatar">
                  {{ getInitials(user.nombre) }}
                </div>
                <div class="chat-widget__conversation-info">
                  <div class="chat-widget__conversation-header">
                    <span class="chat-widget__conversation-name">{{ user.nombre }}</span>
                  </div>
                  <div class="chat-widget__conversation-preview">
                    {{ user.email }}
                  </div>
                </div>
                <div v-if="user.unread_count > 0" class="chat-widget__unread-badge">
                  {{ user.unread_count }}
                </div>
              </div>
            </div>
            
            <!-- Sección de conversaciones activas (si existen) -->
            <div v-if="conversations.length > 0" class="chat-widget__section">
              <div class="chat-widget__section-title">Conversaciones recientes</div>
              <div 
                v-for="conv in conversations"
                :key="'conv-' + conv.user_id"
                class="chat-widget__conversation-item"
                :class="{ 'chat-widget__conversation-item--unread': conv.unread_count > 0 }"
                @click="openConversation(conv)"
              >
                <div class="chat-widget__user-avatar">
                  {{ getInitials(conv.user_name) }}
                </div>
                <div class="chat-widget__conversation-info">
                  <div class="chat-widget__conversation-header">
                    <span class="chat-widget__conversation-name">{{ conv.user_name }}</span>
                    <span class="chat-widget__conversation-time">
                      {{ formatTime(conv.last_message_at) }}
                    </span>
                  </div>
                  <div class="chat-widget__conversation-preview">
                    <span v-if="conv.last_sender_id === currentUserId">Tú: </span>
                    {{ truncate(conv.last_message, 40) }}
                  </div>
                </div>
                <div v-if="conv.unread_count > 0" class="chat-widget__unread-badge">
                  {{ conv.unread_count }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista de conversación -->
        <div v-else class="chat-widget__conversation-view">
          <!-- Mensajes -->
          <div class="chat-widget__messages" ref="messagesContainer">
            <!-- DEBUG: Total messages: {{ messages.length }} -->
            <div 
              v-for="message in messages"
              :key="message.id"
              :data-message-id="message.id"
              :data-sender="message.sender_id"
              class="chat-widget__message"
              :class="{
                'chat-widget__message--sent': message.sender_id === currentUserId,
                'chat-widget__message--received': message.sender_id !== currentUserId
              }"
            >
              <div class="chat-widget__message-bubble">
                <div class="chat-widget__message-text">{{ message.message }}</div>
                <div class="chat-widget__message-time">
                  {{ formatTime(message.created_at) }}
                  <span v-if="message.sender_id === currentUserId" class="chat-widget__message-status">
                    <svg v-if="message.read_at" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <!-- Double check para leído -->
                      <path d="M0 9l1.5-1.5L5 11l9-9L15.5 3.5 5 14z"/>
                      <path d="M7 9l1.5-1.5L12 11l9-9L22.5 3.5 12 14z" transform="translate(-6, 0)"/>
                    </svg>
                    <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <!-- Single check para enviado -->
                      <path d="M0 9l1.5-1.5L5 11l9-9L15.5 3.5 5 14z"/>
                    </svg>
                  </span>
                </div>
              </div>
            </div>
            <div v-if="loadingMessages" class="chat-widget__loading">
              Cargando mensajes...
            </div>
          </div>

          <!-- Input de mensaje -->
          <div class="chat-widget__input-area">
            <textarea
              v-model="messageInput"
              placeholder="Escribe un mensaje..."
              class="chat-widget__input"
              rows="1"
              @keydown.enter.exact.prevent="sendMessage"
              @input="autoResize"
              ref="messageTextarea"
            ></textarea>
            <button 
              @click="sendMessage"
              class="chat-widget__send-btn"
              :disabled="!messageInput.trim() || sending"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { getCurrentUser } from '../services/authService';

const props = defineProps({
  apiOrigin: {
    type: String,
    default: '',
  },
});

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_ORIGIN || (import.meta.env.DEV ? 'http://localhost:4000' : '');
const apiOrigin = computed(() => props.apiOrigin || API_BASE);

// Estado
const isOpen = ref(false);
const isMinimized = ref(false);
const conversations = ref([]);
const allUsers = ref([]);
const currentConversation = ref(null);
const messages = ref([]);
const messageInput = ref('');
const searchQuery = ref('');
const searchResults = ref([]);
const totalUnread = ref(0);
const loadingMessages = ref(false);
const sending = ref(false);
const messagesContainer = ref(null);
const messageTextarea = ref(null);
let pollingInterval = null;
const isPolling = ref(false);

// Debug watcher
watch(allUsers, (newVal) => {
  console.log('[ChatWidget] allUsers cambió:', newVal.length, 'usuarios');
}, { deep: true });

watch(messages, (newVal) => {
  console.log('[ChatWidget] messages cambió:', newVal.length, 'mensajes');
}, { deep: true });

// Usuario actual - actualizar cuando cambie
const currentUser = ref(null);
const currentUserId = computed(() => {
  const user = currentUser.value;
  if (!user) return null;
  return user.idUsuarios || user.id || user.idUsers || null;
});

let searchTimeout = null;
let eventSource = null;

// Actualizar el usuario cuando se monte el componente
onMounted(() => {
  updateCurrentUser();
  
  // Escuchar cambios en localStorage (para detectar login/logout)
  window.addEventListener('storage', handleStorageChange);
  
  // Intervalo para verificar el usuario cada segundo
  const userCheckInterval = setInterval(() => {
    updateCurrentUser();
  }, 1000);
  
  // Limpiar intervalo al desmontar
  onBeforeUnmount(() => {
    clearInterval(userCheckInterval);
    window.removeEventListener('storage', handleStorageChange);
  });
  
  // Cargar contador de no leídos inicial
  if (currentUserId.value) {
    fetch(`${apiOrigin.value}/api/chat/unread?userId=${currentUserId.value}`)
      .then(res => res.json())
      .then(data => {
        totalUnread.value = data.count || 0;
      })
      .catch(err => console.error('Error cargando no leídos:', err));
  }
});

function handleStorageChange(e) {
  if (e.key === 'auth_user' || e.key === 'auth_token') {
    updateCurrentUser();
  }
}

function updateCurrentUser() {
  const user = getCurrentUser();
  if (JSON.stringify(user) !== JSON.stringify(currentUser.value)) {
    console.log('[ChatWidget] Usuario actual:', user);
    currentUser.value = user;
  }
}

// Métodos
async function toggleChat() {
  try {
    // No permitir cerrar si se está enviando un mensaje
    if (sending.value && isOpen.value) {
      return;
    }
    
    isOpen.value = !isOpen.value;
    console.log('[ChatWidget] toggleChat - isOpen:', isOpen.value);
    
    if (isOpen.value) {
      isMinimized.value = false;
      updateCurrentUser(); // Actualizar usuario al abrir
      
      console.log('[ChatWidget] toggleChat - currentUser:', currentUser.value);
      console.log('[ChatWidget] toggleChat - currentUserId:', currentUserId.value);
      
      if (!currentUserId.value) {
        console.error('[ChatWidget] No hay usuario autenticado');
        isOpen.value = false;
        return;
      }
      
      // SSE deshabilitado por problemas de performance
      console.log('[ChatWidget] SSE deshabilitado - usando polling');
      
      console.log('[ChatWidget] Iniciando carga de conversaciones...');
      await loadConversations();
      console.log('[ChatWidget] Conversaciones cargadas, iniciando carga de usuarios...');
      await loadAllUsers();
      console.log('[ChatWidget] Todo completado');
    } else {
      disconnectRealtime();
    }
  } catch (error) {
    console.error('[ChatWidget] Error en toggleChat:', error);
  }
}

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  
  // El servidor ya devuelve fechas en timezone correcto (-03:00)
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffMins < 1440) {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h`;
  }
  
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
}

function truncate(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

async function loadConversations() {
  try {
    console.log('[ChatWidget] loadConversations - iniciando, userId:', currentUserId.value);
    const url = `${apiOrigin.value}/api/chat/conversations?userId=${currentUserId.value}`;
    console.log('[ChatWidget] loadConversations - URL:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout
    
    const response = await fetch(url, { 
      signal: controller.signal,
      cache: 'no-store',
      keepalive: false
    });
    clearTimeout(timeoutId);
    
    console.log('[ChatWidget] loadConversations - response status:', response.status);
    
    const data = await response.json();
    console.log('[ChatWidget] loadConversations - data:', data);
    
    conversations.value = data.conversations || [];
    console.log('[ChatWidget] loadConversations - conversations asignadas:', conversations.value.length);
    
    // Calcular total de no leídos
    totalUnread.value = conversations.value.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
    console.log('[ChatWidget] loadConversations - completado');
  } catch (error) {
    console.error('[ChatWidget] Error cargando conversaciones:', error);
    if (error.name === 'AbortError') {
      console.error('[ChatWidget] Timeout en loadConversations');
    }
    conversations.value = [];
  }
}

async function loadAllUsers() {
  try {
    console.log('[ChatWidget] Cargando usuarios, userId:', currentUserId.value);
    const response = await fetch(`${apiOrigin.value}/api/chat/users?userId=${currentUserId.value}`);
    console.log('[ChatWidget] Response status:', response.status);
    const data = await response.json();
    console.log('[ChatWidget] Usuarios recibidos:', JSON.stringify(data, null, 2));
    console.log('[ChatWidget] Cantidad de usuarios:', data.users?.length || 0);
    
    // Asignar directamente el array
    allUsers.value = data.users || [];
    
    console.log('[ChatWidget] allUsers.value asignado:', allUsers.value.length, 'usuarios');
  } catch (error) {
    console.error('[ChatWidget] Error cargando usuarios:', error);
    allUsers.value = [];
  }
}

async function openConversation(conv) {
  currentConversation.value = {
    user_id: conv.user_id,
    user_name: conv.user_name,
    avatar: conv.avatar,
  };
  
  await loadMessages(conv.user_id);
  await markAsRead(conv.user_id);
  
  // Iniciar polling para esta conversación
  connectRealtime();
}

async function openUserConversation(user) {
  currentConversation.value = {
    user_id: user.id,
    user_name: user.nombre,
    avatar: user.avatar,
  };
  
  // Cargar mensajes existentes
  await loadMessages(user.id);
  await markAsRead(user.id);
  
  // Iniciar polling para esta conversación
  connectRealtime();
  
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.focus();
    }
  });
}

async function startConversation(user) {
  currentConversation.value = {
    user_id: user.id,
    user_name: user.nombre,
    avatar: user.avatar,
  };
  
  // Iniciar polling para esta conversación
  connectRealtime();
  
  searchQuery.value = '';
  searchResults.value = [];
  
  // Cargar mensajes existentes
  await loadMessages(user.id);
  await markAsRead(user.id);
  
  nextTick(() => {
    if (messageTextarea.value) {
      messageTextarea.value.focus();
    }
  });
}

function closeConversation() {
  currentConversation.value = null;
  messages.value = [];
  loadConversations();
}

async function loadMessages(otherUserId) {
  loadingMessages.value = true;
  
  try {
    console.log('[ChatWidget] Cargando mensajes, otherUserId:', otherUserId, 'currentUserId:', currentUserId.value);
    const url = `${apiOrigin.value}/api/chat/messages/${otherUserId}?userId=${currentUserId.value}&limit=50`;
    console.log('[ChatWidget] URL de mensajes:', url);
    
    // Usar fetch simple - el servicio SSE unificado ya resolvió el problema
    const response = await fetch(url, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[ChatWidget] Mensajes recibidos:', data.messages?.length || 0, 'mensajes');
    
    // Asignar directamente
    messages.value = data.messages || [];
    
    console.log('[ChatWidget] messages.value asignado:', messages.value.length, 'mensajes');
    
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('[ChatWidget] Error cargando mensajes:', error);
    messages.value = [];
  } finally {
    loadingMessages.value = false;
    console.log('[ChatWidget] loadingMessages.value = false');
  }
}

async function sendMessage() {
  if (!messageInput.value.trim() || sending.value || !currentConversation.value) return;
  
  const messageText = messageInput.value.trim();
  const tempId = Date.now(); // ID temporal
  
  // Crear mensaje optimista ANTES de enviar
  const optimisticMessage = {
    id: tempId,
    sender_id: currentUserId.value,
    receiver_id: currentConversation.value.user_id,
    message: messageText,
    created_at: new Date().toISOString(),
    read_at: null,
    sender_name: currentUser.value?.nome || 'Tú',
    sender_avatar: currentUser.value?.foto || null,
    _pending: true // Marcador temporal
  };
  
  // Agregar inmediatamente a la UI
  messages.value = [...messages.value, optimisticMessage];
  messageInput.value = '';
  await nextTick();
  scrollToBottom();
  
  sending.value = true;
  
  try {
    const response = await fetch(`${apiOrigin.value}/api/chat/messages?userId=${currentUserId.value}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiverId: currentConversation.value.user_id,
        message: messageText,
      }),
    });
    
    if (!response.ok) throw new Error('Error enviando mensaje');
    
    const data = await response.json();
    
    // Reemplazar mensaje optimista con el real
    if (data.message) {
      messages.value = messages.value.map(msg => 
        msg.id === tempId ? data.message : msg
      );
    }
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    // Eliminar mensaje optimista si falló
    messages.value = messages.value.filter(msg => msg.id !== tempId);
    // Restaurar el texto
    messageInput.value = messageText;
  } finally {
    sending.value = false;
  }
}

async function markAsRead(otherUserId) {
  try {
    await fetch(
      `${apiOrigin.value}/api/chat/messages/read/${otherUserId}?userId=${currentUserId.value}`,
      { method: 'PUT' }
    );
    
    // Actualizar el contador local
    const conv = conversations.value.find(c => c.user_id === otherUserId);
    if (conv) {
      totalUnread.value -= conv.unread_count || 0;
      conv.unread_count = 0;
    }
  } catch (error) {
    console.error('Error marcando como leído:', error);
  }
}

function onSearchInput() {
  clearTimeout(searchTimeout);
  
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(
        `${apiOrigin.value}/api/chat/search?userId=${currentUserId.value}&q=${encodeURIComponent(searchQuery.value)}`
      );
      const data = await response.json();
      searchResults.value = data.users || [];
    } catch (error) {
      console.error('Error buscando usuarios:', error);
    }
  }, 300);
}

function autoResize(event) {
  const textarea = event.target;
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
}

function scrollToBottom() {
  if (messagesContainer.value) {
    console.log('[ChatWidget] scrollToBottom - scrollHeight:', messagesContainer.value.scrollHeight, 'clientHeight:', messagesContainer.value.clientHeight);
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  } else {
    console.log('[ChatWidget] scrollToBottom - messagesContainer es null');
  }
}

function connectRealtime() {
  if (!currentUserId.value) return;
  
  console.log('[ChatWidget] Iniciando polling para mensajes nuevos');
  
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Polling cada 5 segundos (aumentado para reducir carga)
  pollingInterval = setInterval(async () => {
    // Solo si hay una conversación activa, el chat está abierto y NO está enviando
    if (!currentConversation.value || !isOpen.value || sending.value) return;
    
    isPolling.value = true;
    
    const otherUserId = currentConversation.value.user_id;
    const lastMessageId = messages.value.length > 0 
      ? Math.max(...messages.value.filter(m => !m._pending).map(m => m.id))
      : 0;
    
    try {
      const response = await fetch(
        `${apiOrigin.value}/api/chat/messages/${otherUserId}?userId=${currentUserId.value}&since=${lastMessageId}&limit=10`,
        { cache: 'no-store' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          console.log('[ChatWidget] Nuevos mensajes:', data.messages.length);
          
          // Evitar duplicados - solo agregar mensajes que no existen
          const existingIds = new Set(messages.value.filter(m => !m._pending).map(m => m.id));
          const newMessages = data.messages.filter(m => !existingIds.has(m.id));
          
          if (newMessages.length > 0) {
            messages.value = [...messages.value, ...newMessages];
            await nextTick();
            scrollToBottom();
            markAsRead(otherUserId);
          }
        }
      }
    } catch (err) {
      // Silenciar errores para no llenar la consola
    } finally {
      // Ocultar indicador después de medio segundo
      setTimeout(() => {
        isPolling.value = false;
      }, 500);
    }
  }, 5000); // Cambiado de 3s a 5s
}

function disconnectRealtime() {
  console.log('[ChatWidget] Desconectando polling');
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

onBeforeUnmount(() => {
  disconnectRealtime();
});
</script>

<style scoped>
.chat-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.chat-widget__trigger {
  width: 60px;
  height: 60px;
  border-radius: 2px;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.5), rgba(0, 0, 0, 0.95));
  border: 1px solid rgba(255, 20, 147, 0.8);
  color: #FF1493;
  cursor: pointer;
  box-shadow: 
    0 0 30px rgba(255, 20, 147, 0.5),
    0 0 50px rgba(255, 20, 147, 0.3),
    0 10px 30px rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s;
  filter: drop-shadow(0 0 10px rgba(255, 20, 147, 0.6));
}

.chat-widget__trigger::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.9), transparent);
}

.chat-widget__trigger:hover {
  transform: scale(1.08) translateY(-2px);
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.7), rgba(0, 0, 0, 0.98));
  box-shadow: 
    0 0 40px rgba(255, 20, 147, 0.8),
    0 0 70px rgba(255, 20, 147, 0.5),
    0 15px 40px rgba(0, 0, 0, 0.9);
  filter: drop-shadow(0 0 15px rgba(255, 20, 147, 0.9));
}

.chat-widget__trigger--unread {
  animation: pulse-widget 1.5s infinite;
}

@keyframes pulse-widget {
  0%, 100% { 
    box-shadow: 
      0 0 30px rgba(255, 20, 147, 0.5),
      0 0 50px rgba(255, 20, 147, 0.3),
      0 10px 30px rgba(0, 0, 0, 0.8);
  }
  50% { 
    box-shadow: 
      0 0 50px rgba(255, 20, 147, 0.9),
      0 0 80px rgba(255, 20, 147, 0.6),
      0 15px 40px rgba(0, 0, 0, 0.9);
  }
}

.chat-widget__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, rgba(255, 69, 0, 0.9), rgba(255, 0, 0, 0.9));
  border: 1px solid rgba(255, 69, 0, 1);
  color: white;
  border-radius: 2px;
  padding: 3px 7px;
  font-size: 10px;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
  text-shadow: 
    0 0 8px rgba(255, 69, 0, 1),
    0 0 15px rgba(255, 69, 0, 0.6);
  box-shadow: 
    0 0 20px rgba(255, 69, 0, 0.8),
    inset 0 0 10px rgba(255, 69, 0, 0.3);
  animation: pulse-badge-widget 1.2s ease-in-out infinite;
}

@keyframes pulse-badge-widget {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(255, 69, 0, 0.8),
      inset 0 0 10px rgba(255, 69, 0, 0.3);
  }
  50% {
    box-shadow: 
      0 0 35px rgba(255, 69, 0, 1),
      0 0 60px rgba(255, 69, 0, 0.6),
      inset 0 0 15px rgba(255, 69, 0, 0.4);
  }
}

.chat-widget__window {
  width: 360px;
  height: 500px;
  background: rgba(10, 10, 10, 0.98);
  border-radius: 4px;
  border: 1px solid rgba(255, 20, 147, 0.5);
  box-shadow: 
    0 0 40px rgba(255, 20, 147, 0.4),
    0 10px 40px rgba(0, 0, 0, 0.9),
    inset 0 0 30px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.chat-widget--minimized .chat-widget__window {
  height: 56px;
}

.chat-widget__header {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(0, 255, 255, 0.3), rgba(10, 10, 10, 0.95));
  color: #FF1493;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 20, 147, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  text-shadow: 
    0 0 10px rgba(255, 20, 147, 0.8),
    0 0 20px rgba(255, 20, 147, 0.4);
  box-shadow: 
    inset 0 -1px 0 rgba(255, 20, 147, 0.3),
    0 2px 15px rgba(255, 20, 147, 0.2);
  position: relative;
}

.chat-widget__header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.8), transparent);
}

.chat-widget__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  font-family: 'Rajdhani', 'Orbitron', monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #FF1493;
}

.chat-widget__polling-indicator {
  display: inline-flex;
  align-items: center;
  margin-left: 8px;
}

.chat-widget__spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.chat-widget__back {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  margin-right: 8px;
  line-height: 1;
}

.chat-widget__header-actions {
  display: flex;
  gap: 8px;
}

.chat-widget__action-btn {
  background: rgba(255, 20, 147, 0.2);
  border: 1px solid rgba(255, 20, 147, 0.4);
  color: #FF1493;
  width: 28px;
  height: 28px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  text-shadow: 0 0 5px rgba(255, 20, 147, 0.6);
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.2);
}

.chat-widget__action-btn:hover {
  background: rgba(255, 20, 147, 0.4);
  border-color: rgba(255, 20, 147, 0.8);
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.5),
    inset 0 0 10px rgba(255, 20, 147, 0.2);
  text-shadow: 
    0 0 10px rgba(255, 20, 147, 1),
    0 0 20px rgba(255, 20, 147, 0.5);
}

.chat-widget__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.chat-widget__conversations {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-widget__search {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 20, 147, 0.3);
  flex-shrink: 0;
  background: rgba(10, 10, 10, 0.95);
}

.chat-widget__search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(255, 20, 147, 0.4);
  border-radius: 2px;
  background: rgba(5, 5, 5, 0.9);
  color: #E8E8E8;
  font-size: 13px;
  font-family: 'Rajdhani', 'Courier New', monospace;
  outline: none;
  transition: all 0.2s;
  box-shadow: 
    0 0 10px rgba(255, 20, 147, 0.1),
    inset 0 0 15px rgba(0, 0, 0, 0.7);
}

.chat-widget__search-input::placeholder {
  color: rgba(255, 20, 147, 0.4);
}

.chat-widget__search-input:focus {
  border-color: rgba(255, 20, 147, 0.8);
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.3),
    inset 0 0 20px rgba(255, 20, 147, 0.1);
  text-shadow: 0 0 3px rgba(255, 20, 147, 0.2);
}

.chat-widget__search-results,
.chat-widget__conversation-list {
  flex: 1;
  overflow-y: auto;
}

.chat-widget__empty {
  padding: 32px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.chat-widget__user-item,
.chat-widget__conversation-item {
  padding: 12px 16px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 20, 147, 0.15);
  transition: all 0.2s;
  background: rgba(10, 10, 10, 0.5);
}

.chat-widget__user-item:hover,
.chat-widget__conversation-item:hover {
  background: rgba(255, 20, 147, 0.12);
  border-color: rgba(255, 20, 147, 0.3);
  box-shadow: 
    inset 0 0 20px rgba(255, 20, 147, 0.1),
    0 0 10px rgba(255, 20, 147, 0.2);
}

.chat-widget__conversation-item--unread {
  background: rgba(255, 20, 147, 0.08);
  border-left: 3px solid rgba(255, 20, 147, 0.8);
  box-shadow: inset 0 0 15px rgba(255, 20, 147, 0.1);
}

.chat-widget__user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.6), rgba(0, 255, 255, 0.6));
  border: 1px solid rgba(255, 20, 147, 0.8);
  color: #0A0A0A;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  text-shadow: none;
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.5);
}

.chat-widget__user-info {
  flex: 1;
  min-width: 0;
}

.chat-widget__user-name {
  font-weight: 600;
  font-size: 13px;
  color: #E8E8E8;
  font-family: 'Rajdhani', monospace;
  letter-spacing: 0.05em;
}

.chat-widget__user-email {
  font-size: 11px;
  color: rgba(255, 20, 147, 0.6);
  margin-top: 2px;
  font-family: 'Courier New', monospace;
}

.chat-widget__conversation-info {
  flex: 1;
  min-width: 0;
}

.chat-widget__conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.chat-widget__conversation-name {
  font-weight: 600;
  font-size: 13px;
  color: #E8E8E8;
  font-family: 'Rajdhani', monospace;
  letter-spacing: 0.05em;
}

.chat-widget__conversation-time {
  font-size: 10px;
  color: rgba(0, 255, 255, 0.6);
  font-family: 'Courier New', monospace;
}

.chat-widget__conversation-preview {
  font-size: 12px;
  color: rgba(200, 200, 200, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: 'Courier New', monospace;
}

.chat-widget__unread-badge {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.8), rgba(157, 0, 255, 0.8));
  border: 1px solid rgba(255, 20, 147, 0.9);
  color: white;
  border-radius: 2px;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 700;
  align-self: center;
  text-shadow: 0 0 5px rgba(255, 20, 147, 0.8);
  box-shadow: 
    0 0 15px rgba(255, 20, 147, 0.5),
    inset 0 0 10px rgba(255, 20, 147, 0.2);
}

.chat-widget__section {
  border-bottom: 1px solid #f3f4f6;
}

.chat-widget__section-title {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #9ca3af;
  background: #f9fafb;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.chat-widget__conversation-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-widget__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-widget__loading {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 16px;
}

.chat-widget__message {
  display: flex;
  margin-bottom: 12px;
}

.chat-widget__message--sent {
  justify-content: flex-end;
}

.chat-widget__message--received {
  justify-content: flex-start;
}

.chat-widget__message-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  word-wrap: break-word;
}

.chat-widget__message--sent .chat-widget__message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.chat-widget__message--received .chat-widget__message-bubble {
  background: #f3f4f6;
  color: #111827;
  border-bottom-left-radius: 4px;
}

.chat-widget__message-text {
  font-size: 14px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.chat-widget__message-time {
  font-size: 10px;
  margin-top: 4px;
  opacity: 0.7;
  display: flex;
  align-items: center;
  gap: 4px;
}

.chat-widget__message-status {
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
}

.chat-widget__message-status svg {
  width: 14px;
  height: 14px;
}

/* Check azul cuando está leído */
.chat-widget__message--sent .chat-widget__message-bubble .chat-widget__message-status svg {
  color: #667eea;
}

/* Check gris cuando solo está enviado */
.chat-widget__message--sent .chat-widget__message-bubble .chat-widget__message-time {
  color: inherit;
}

.chat-widget__input-area {
  padding: 12px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  background: white;
  flex-shrink: 0;
}

.chat-widget__input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  font-size: 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  max-height: 100px;
  overflow-y: auto;
}

.chat-widget__input:focus {
  border-color: #667eea;
}

.chat-widget__send-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.chat-widget__send-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.chat-widget__send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar styling */
.chat-widget__messages::-webkit-scrollbar,
.chat-widget__conversation-list::-webkit-scrollbar,
.chat-widget__search-results::-webkit-scrollbar {
  width: 6px;
}

.chat-widget__messages::-webkit-scrollbar-track,
.chat-widget__conversation-list::-webkit-scrollbar-track,
.chat-widget__search-results::-webkit-scrollbar-track {
  background: transparent;
}

.chat-widget__messages::-webkit-scrollbar-thumb,
.chat-widget__conversation-list::-webkit-scrollbar-thumb,
.chat-widget__search-results::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.chat-widget__messages::-webkit-scrollbar-thumb:hover,
.chat-widget__conversation-list::-webkit-scrollbar-thumb:hover,
.chat-widget__search-results::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>

