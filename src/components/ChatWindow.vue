<template>
  <div class="chat-window" :class="{ 'chat-window--minimized': isMinimized }">
    <!-- Header -->
    <div class="chat-window__header" @click="toggleMinimize">
      <div class="chat-window__user-info">
        <div class="chat-window__avatar">{{ getInitials(userName) }}</div>
        <span class="chat-window__name">{{ userName }}</span>
        <span v-if="isPolling" class="chat-window__status">●</span>
        <span v-if="isMinimized && unreadCount > 0" class="chat-window__unread-badge">{{ unreadCount }}</span>
      </div>
      <div class="chat-window__actions" @click.stop>
        <button @click="toggleMinimize" class="chat-window__btn" title="Minimizar">
          {{ isMinimized ? '▢' : '_' }}
        </button>
        <button @click="$emit('close')" class="chat-window__btn" title="Cerrar">×</button>
      </div>
    </div>

    <!-- Mensajes -->
    <div v-show="!isMinimized" class="chat-window__body">
      <div class="chat-window__messages" ref="messagesContainer">
        <div 
          v-for="message in messages"
          :key="message.id"
          class="chat-window__message"
          :class="{
            'chat-window__message--sent': message.sender_id === currentUserId,
            'chat-window__message--received': message.sender_id !== currentUserId,
            'chat-window__message--pending': message._pending
          }"
        >
          <div class="chat-window__message-bubble">
            <div class="chat-window__message-text">{{ message.message }}</div>
            <div class="chat-window__message-time">{{ formatTime(message.created_at) }}</div>
          </div>
        </div>
        <div v-if="loadingMessages" class="chat-window__loading">Cargando...</div>
      </div>

      <!-- Input -->
      <div class="chat-window__input-container">
        <textarea
          v-model="messageInput"
          @keydown.enter.exact.prevent="sendMessage"
          placeholder="Escribe un mensaje..."
          class="chat-window__input"
          rows="1"
        ></textarea>
        <button @click="sendMessage" :disabled="!messageInput.trim() || sending" class="chat-window__send">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  userId: { type: Number, required: true },
  userName: { type: String, required: true },
  currentUserId: { type: Number, required: true },
  apiOrigin: { type: String, required: true }
});

const emit = defineEmits(['close', 'newMessage', 'unreadUpdate']);

const messages = ref([]);
const messageInput = ref('');
const isMinimized = ref(false);
const loadingMessages = ref(false);
const sending = ref(false);
const messagesContainer = ref(null);
const isPolling = ref(false);
const unreadCount = ref(0);
let pollingInterval = null;

onMounted(() => {
  loadMessages();
  startPolling();
  // Marcar como leído al abrir
  markAsRead();
});

onBeforeUnmount(() => {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
});

function toggleMinimize() {
  isMinimized.value = !isMinimized.value;
  if (!isMinimized.value) {
    // Al maximizar, limpiar no leídos y marcar como leído
    unreadCount.value = 0;
    emit('unreadUpdate', { userId: props.userId, count: 0 });
    markAsRead();
    nextTick(() => scrollToBottom());
  }
}

async function markAsRead() {
  try {
    await fetch(
      `${props.apiOrigin}/api/chat/messages/read/${props.userId}?userId=${props.currentUserId}`,
      { method: 'PUT' }
    );
  } catch (error) {
    console.error('Error marcando como leído:', error);
  }
}

async function loadMessages() {
  loadingMessages.value = true;
  try {
    const response = await fetch(
      `${props.apiOrigin}/api/chat/messages/${props.userId}?userId=${props.currentUserId}&limit=50`,
      { cache: 'no-store' }
    );
    
    if (response.ok) {
      const data = await response.json();
      messages.value = data.messages || [];
      await nextTick();
      scrollToBottom();
    }
  } catch (error) {
    console.error('Error cargando mensajes:', error);
  } finally {
    loadingMessages.value = false;
  }
}

function startPolling() {
  pollingInterval = setInterval(async () => {
    if (sending.value) return;
    
    isPolling.value = true;
    
    const lastMessageId = messages.value.length > 0 
      ? Math.max(...messages.value.filter(m => !m._pending).map(m => m.id))
      : 0;
    
    try {
      const response = await fetch(
        `${props.apiOrigin}/api/chat/messages/${props.userId}?userId=${props.currentUserId}&since=${lastMessageId}&limit=10`,
        { cache: 'no-store' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          const existingIds = new Set(messages.value.filter(m => !m._pending).map(m => m.id));
          const newMessages = data.messages.filter(m => !existingIds.has(m.id));
          
          if (newMessages.length > 0) {
            messages.value = [...messages.value, ...newMessages];
            
            // Si está minimizada, incrementar contador de no leídos
            if (isMinimized.value) {
              unreadCount.value += newMessages.length;
              emit('unreadUpdate', { userId: props.userId, count: unreadCount.value });
            } else {
              // Si está abierta y maximizada, marcar como leído inmediatamente
              markAsRead();
            }
            
            await nextTick();
            scrollToBottom();
            
            // Emitir evento de mensaje nuevo para el sonido
            emit('newMessage', newMessages[0]);
          }
        }
      }
    } catch (err) {
      // Silenciar
    } finally {
      setTimeout(() => {
        isPolling.value = false;
      }, 500);
    }
  }, 5000);
}

async function sendMessage() {
  if (!messageInput.value.trim() || sending.value) return;
  
  const messageText = messageInput.value.trim();
  const tempId = Date.now();
  
  const optimisticMessage = {
    id: tempId,
    sender_id: props.currentUserId,
    receiver_id: props.userId,
    message: messageText,
    created_at: new Date().toISOString(),
    _pending: true
  };
  
  messages.value = [...messages.value, optimisticMessage];
  messageInput.value = '';
  await nextTick();
  scrollToBottom();
  
  sending.value = true;
  
  try {
    const response = await fetch(`${props.apiOrigin}/api/chat/messages?userId=${props.currentUserId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: props.userId,
        message: messageText,
      }),
    });
    
    if (!response.ok) throw new Error('Error enviando mensaje');
    
    const data = await response.json();
    if (data.message) {
      messages.value = messages.value.map(msg => 
        msg.id === tempId ? data.message : msg
      );
    }
  } catch (error) {
    console.error('Error enviando mensaje:', error);
    messages.value = messages.value.filter(msg => msg.id !== tempId);
    messageInput.value = messageText;
  } finally {
    sending.value = false;
  }
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
</script>

<style scoped>
.chat-window {
  position: fixed;
  bottom: 0;
  width: 328px;
  height: 455px;
  background: rgba(10, 10, 10, 0.98);
  border-radius: 4px 4px 0 0;
  border: 1px solid rgba(255, 20, 147, 0.4);
  border-bottom: none;
  box-shadow: 
    0 0 30px rgba(255, 20, 147, 0.2),
    0 -10px 30px rgba(0, 0, 0, 0.8),
    inset 0 0 30px rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  z-index: 9998;
  transition: height 0.2s;
  backdrop-filter: blur(10px);
}

.chat-window--minimized {
  height: 48px;
}

.chat-window__header {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.3), rgba(0, 255, 255, 0.25), rgba(10, 10, 10, 0.95));
  color: #FF1493;
  padding: 12px 16px;
  border-radius: 4px 4px 0 0;
  border-bottom: 1px solid rgba(255, 20, 147, 0.4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  text-shadow: 
    0 0 8px rgba(255, 20, 147, 0.6),
    0 0 15px rgba(255, 20, 147, 0.3);
  box-shadow: 
    inset 0 -1px 0 rgba(255, 20, 147, 0.25),
    0 2px 12px rgba(255, 20, 147, 0.15);
  position: relative;
}

.chat-window__header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.7), transparent);
}

.chat-window__user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.chat-window__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.5), rgba(0, 255, 255, 0.5));
  border: 1px solid rgba(255, 20, 147, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #0A0A0A;
  text-shadow: none;
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.4);
}

.chat-window__name {
  font-size: 13px;
  font-weight: 700;
  font-family: 'Rajdhani', 'Orbitron', monospace;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  flex: 1;
  color: #FF1493;
}

.chat-window__status {
  color: #00FFFF;
  font-size: 10px;
  animation: pulse 2s infinite;
  text-shadow: 
    0 0 10px rgba(0, 255, 255, 1),
    0 0 20px rgba(0, 255, 255, 0.5);
}

.chat-window__unread-badge {
  background: linear-gradient(135deg, rgba(255, 69, 0, 0.9), rgba(255, 0, 0, 0.9));
  border: 1px solid rgba(255, 69, 0, 1);
  color: white;
  border-radius: 2px;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  text-align: center;
  margin-left: auto;
  text-shadow: 
    0 0 8px rgba(255, 69, 0, 1),
    0 0 15px rgba(255, 69, 0, 0.5);
  box-shadow: 
    0 0 15px rgba(255, 69, 0, 0.6),
    inset 0 0 10px rgba(255, 69, 0, 0.3);
  animation: pulse-badge-chat 1.5s ease-in-out infinite;
}

@keyframes pulse-badge-chat {
  0%, 100% {
    box-shadow: 
      0 0 15px rgba(255, 69, 0, 0.6),
      inset 0 0 10px rgba(255, 69, 0, 0.3);
  }
  50% {
    box-shadow: 
      0 0 30px rgba(255, 69, 0, 0.9),
      0 0 50px rgba(255, 69, 0, 0.5),
      inset 0 0 15px rgba(255, 69, 0, 0.4);
  }
}

.chat-window__actions {
  display: flex;
  gap: 4px;
}

.chat-window__btn {
  background: rgba(255, 20, 147, 0.15);
  border: 1px solid rgba(255, 20, 147, 0.35);
  color: #FF1493;
  width: 24px;
  height: 24px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  text-shadow: 0 0 4px rgba(255, 20, 147, 0.5);
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.15);
}

.chat-window__btn:hover {
  background: rgba(255, 20, 147, 0.3);
  border-color: rgba(255, 20, 147, 0.7);
  box-shadow: 
    0 0 15px rgba(255, 20, 147, 0.4),
    inset 0 0 8px rgba(255, 20, 147, 0.15);
  text-shadow: 
    0 0 8px rgba(255, 20, 147, 0.9),
    0 0 15px rgba(255, 20, 147, 0.4);
}

.chat-window__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.chat-window__messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-window__message {
  display: flex;
  margin-bottom: 4px;
}

.chat-window__message--sent {
  justify-content: flex-end;
}

.chat-window__message--received {
  justify-content: flex-start;
}

.chat-window__message--pending {
  opacity: 0.6;
}

.chat-window__message-bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 2px;
  word-wrap: break-word;
  border: 1px solid;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.chat-window__message--sent .chat-window__message-bubble {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.25), rgba(10, 10, 10, 0.95));
  border-color: rgba(255, 20, 147, 0.4);
  color: #E8E8E8;
  box-shadow: 
    0 0 12px rgba(255, 20, 147, 0.15),
    inset 0 0 12px rgba(255, 20, 147, 0.08);
}

.chat-window__message--received .chat-window__message-bubble {
  background: rgba(15, 15, 15, 0.9);
  border-color: rgba(0, 255, 255, 0.25);
  color: #E8E8E8;
  box-shadow: 
    0 0 8px rgba(0, 255, 255, 0.12),
    inset 0 0 10px rgba(0, 0, 0, 0.5);
}

.chat-window__message-text {
  font-size: 14px;
  line-height: 1.4;
}

.chat-window__message-time {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
}

.chat-window__input-container {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(255, 20, 147, 0.25);
  background: rgba(10, 10, 10, 0.95);
  box-shadow: inset 0 1px 10px rgba(0, 0, 0, 0.7);
}

.chat-window__input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 2px;
  background: rgba(5, 5, 5, 0.9);
  color: #E8E8E8;
  font-size: 13px;
  font-family: 'Rajdhani', 'Courier New', monospace;
  resize: none;
  max-height: 80px;
  box-shadow: 
    0 0 8px rgba(255, 20, 147, 0.08),
    inset 0 0 15px rgba(0, 0, 0, 0.7);
  transition: all 0.2s;
}

.chat-window__input::placeholder {
  color: rgba(255, 20, 147, 0.35);
}

.chat-window__input:focus {
  outline: none;
  border-color: rgba(255, 20, 147, 0.6);
  box-shadow: 
    0 0 15px rgba(255, 20, 147, 0.25),
    inset 0 0 15px rgba(255, 20, 147, 0.08);
  text-shadow: 0 0 3px rgba(255, 20, 147, 0.15);
}

.chat-window__send {
  width: 36px;
  height: 36px;
  border-radius: 2px;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(10, 10, 10, 0.9));
  border: 1px solid rgba(255, 20, 147, 0.5);
  color: #FF1493;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 
    0 0 12px rgba(255, 20, 147, 0.25),
    inset 0 0 8px rgba(255, 20, 147, 0.08);
}

.chat-window__send:hover:not(:disabled) {
  transform: scale(1.05);
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.6), rgba(10, 10, 10, 0.95));
  border-color: rgba(255, 20, 147, 0.8);
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.5),
    0 0 35px rgba(255, 20, 147, 0.25),
    inset 0 0 12px rgba(255, 20, 147, 0.15);
  color: #FF1493;
  filter: drop-shadow(0 0 4px rgba(255, 20, 147, 0.7));
}

.chat-window__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-window__loading {
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  padding: 8px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
