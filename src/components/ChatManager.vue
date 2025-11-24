<template>
  <div class="chat-manager">
    <!-- Botón flotante principal -->
    <button 
      class="chat-manager__trigger" 
      @click="toggleUserList"
      :class="{ 'chat-manager__trigger--unread': totalUnread > 0 }"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span v-if="totalUnread > 0" class="chat-manager__badge">{{ totalUnread }}</span>
    </button>

    <!-- Lista de usuarios (popup) -->
    <div v-if="showUserList" class="chat-manager__user-list">
      <div class="chat-manager__list-header">
        <h3>Mensajes</h3>
        <button @click="showUserList = false" class="chat-manager__close">×</button>
      </div>
      <div class="chat-manager__search">
        <input 
          v-model="searchQuery" 
          placeholder="Buscar personas..."
          class="chat-manager__search-input"
        >
      </div>
      <div class="chat-manager__users">
        <div 
          v-for="user in filteredUsers"
          :key="user.id"
          @click="openChat(user)"
          class="chat-manager__user-item"
          :class="{ 'chat-manager__user-item--unread': user.unread_count > 0 }"
        >
          <div class="chat-manager__user-avatar">{{ getInitials(user.nombre) }}</div>
          <div class="chat-manager__user-info">
            <div class="chat-manager__user-name">{{ user.nombre }}</div>
          </div>
          <span v-if="user.unread_count > 0" class="chat-manager__user-badge">{{ user.unread_count }}</span>
        </div>
      </div>
    </div>

    <!-- Ventanas de chat flotantes -->
    <div class="chat-manager__windows">
      <ChatWindow
        v-for="(chat, index) in openChats"
        :key="chat.userId"
        :userId="chat.userId"
        :userName="chat.userName"
        :currentUserId="currentUserId"
        :apiOrigin="apiOrigin"
        :style="{ right: `${400 + (index * 348)}px` }"
        @close="closeChat(chat.userId)"
        @newMessage="handleNewMessage"
        @unreadUpdate="handleUnreadUpdate"
      />
    </div>

    <!-- Notificación toast -->
    <div v-if="showNotification" class="chat-manager__toast">
      <div class="chat-manager__toast-content">
        <div class="chat-manager__toast-avatar">{{ notificationInitials }}</div>
        <div class="chat-manager__toast-info">
          <div class="chat-manager__toast-name">{{ notificationName }}</div>
          <div class="chat-manager__toast-message">{{ notificationMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { getCurrentUser } from '../services/authService';
import { playNotificationSound as playSound } from '../services/notificationSound';
import { useDateTime } from '@/composables/useDateTime';
import ChatWindow from './ChatWindow.vue';

// Chat siempre usa fecha real
const { getCurrentDate } = useDateTime(true);

const props = defineProps({
  apiOrigin: {
    type: String,
    default: '',
  },
});

const API_BASE = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_ORIGIN || (import.meta.env.DEV ? 'http://localhost:4000' : '');
const apiOrigin = computed(() => props.apiOrigin || API_BASE);

const currentUser = ref(null);
const currentUserId = computed(() => {
  const user = currentUser.value;
  if (!user) return null;
  return user.idUsuarios || user.id || user.idUsers || null;
});

const showUserList = ref(false);
const allUsers = ref([]);
const searchQuery = ref('');
const openChats = ref([]);
const totalUnread = ref(0);
const showNotification = ref(false);
const notificationName = ref('');
const notificationMessage = ref('');
const notificationInitials = ref('');
const chatUnreadCounts = ref(new Map());
let globalPollingInterval = null;
let lastGlobalCheck = getCurrentDate().getTime();

onMounted(() => {
  updateCurrentUser();
  if (currentUserId.value) {
    loadAllUsers();
    startGlobalPolling();
  }
});

onBeforeUnmount(() => {
  if (globalPollingInterval) {
    clearInterval(globalPollingInterval);
  }
});

function updateCurrentUser() {
  currentUser.value = getCurrentUser();
}

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return allUsers.value;
  }
  const query = searchQuery.value.toLowerCase();
  return allUsers.value.filter(user => 
    user.nombre.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  );
});

async function loadAllUsers() {
  try {
    const response = await fetch(`${apiOrigin.value}/api/chat/users?userId=${currentUserId.value}`);
    if (response.ok) {
      const data = await response.json();
      allUsers.value = data.users || [];
      totalUnread.value = allUsers.value.reduce((sum, u) => sum + (u.unread_count || 0), 0);
    }
  } catch (error) {
    console.error('Error cargando usuarios:', error);
  }
}

function toggleUserList() {
  showUserList.value = !showUserList.value;
  if (showUserList.value) {
    loadAllUsers();
  }
}

function openChat(user) {
  // Verificar si ya está abierto
  const exists = openChats.value.find(c => c.userId === user.id);
  if (exists) {
    showUserList.value = false;
    return;
  }

  // Máximo 3 chats abiertos
  if (openChats.value.length >= 3) {
    openChats.value.shift(); // Cerrar el más antiguo
  }

  openChats.value.push({
    userId: user.id,
    userName: user.nombre
  });

  // Ocultar notificación si existe para este usuario
  if (notificationName.value === user.nombre) {
    showNotification.value = false;
  }

  showUserList.value = false;
}

function closeChat(userId) {
  openChats.value = openChats.value.filter(c => c.userId !== userId);
  chatUnreadCounts.value.delete(userId);
}

function handleNewMessage(message) {
  const chat = openChats.value.find(c => c.userId === message.sender_id);
  
  // Si el chat NO está abierto, mostrar notificación toast
  if (!chat) {
    const user = allUsers.value.find(u => u.id === message.sender_id);
    if (user) {
      showToastNotification(user.nombre, message.message);
    }
    
    // Recargar lista de usuarios para actualizar contadores
    loadAllUsers();
  }
  
  // Reproducir sonido
  playNotificationSound();
}

function handleUnreadUpdate({ userId, count }) {
  chatUnreadCounts.value.set(userId, count);
}

function showToastNotification(name, message) {
  notificationName.value = name;
  notificationMessage.value = message.length > 50 ? message.substring(0, 50) + '...' : message;
  notificationInitials.value = getInitials(name);
  showNotification.value = true;
  
  // Ocultar después de 4 segundos
  setTimeout(() => {
    showNotification.value = false;
  }, 4000);
}

function startGlobalPolling() {
  // Polling cada 5 segundos para chats cerrados
  globalPollingInterval = setInterval(async () => {
    if (!currentUserId.value) return;
    
    // Revisar mensajes nuevos de todos los usuarios
    try {
      const response = await fetch(
        `${apiOrigin.value}/api/chat/unread?userId=${currentUserId.value}&since=${lastGlobalCheck}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.messages && data.messages.length > 0) {
          // Agrupar mensajes por remitente
          const messagesByUser = new Map();
          data.messages.forEach(msg => {
            if (!messagesByUser.has(msg.sender_id)) {
              messagesByUser.set(msg.sender_id, []);
            }
            messagesByUser.get(msg.sender_id).push(msg);
          });
          
          // Mostrar notificación para cada usuario (solo el último mensaje)
          messagesByUser.forEach((messages, senderId) => {
            const lastMessage = messages[messages.length - 1];
            
            // Solo notificar si el chat NO está abierto
            const isOpen = openChats.value.some(c => c.userId === senderId);
            if (!isOpen) {
              const user = allUsers.value.find(u => u.id === senderId);
              if (user) {
                showToastNotification(user.nombre, lastMessage.message);
                playNotificationSound();
              }
            }
          });
          
          // Actualizar timestamp
          lastGlobalCheck = getCurrentDate().getTime();
          
          // Recargar lista de usuarios
          loadAllUsers();
        }
      }
    } catch (error) {
      console.error('Error en polling global:', error);
    }
  }, 5000);
}

function playNotificationSound() {
  try {
    playSound();
  } catch (error) {
    console.warn('No se pudo reproducir el sonido:', error);
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}
</script>

<style scoped>
.chat-manager {
  position: fixed;
  bottom: 0;
  right: 0;
  z-index: 9999;
}

.chat-manager__trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.6), rgba(255, 20, 147, 0.8));
  border: none;
  outline: none;
  color: white;
  cursor: pointer;
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.5),
    0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10000;
  overflow: visible;
}

.chat-manager__trigger:focus {
  outline: none;
}

.chat-manager__trigger:active {
  outline: none;
}

.chat-manager__trigger svg {
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 0 4px rgba(255, 20, 147, 0.3));
}

.chat-manager__trigger::before {
  content: '';
  position: absolute;
  inset: -50px;
  background: 
    radial-gradient(2px 2px at 20% 30%, white, transparent),
    radial-gradient(2px 2px at 60% 70%, white, transparent),
    radial-gradient(1px 1px at 50% 50%, white, transparent),
    radial-gradient(1px 1px at 80% 10%, white, transparent),
    radial-gradient(2px 2px at 90% 60%, white, transparent),
    radial-gradient(1px 1px at 33% 80%, white, transparent),
    radial-gradient(1px 1px at 15% 70%, white, transparent);
  background-size: 200% 200%;
  background-position: 0% 0%;
  animation: shooting-stars 3s linear infinite;
  opacity: 0.6;
  pointer-events: none;
  z-index: -1;
}

@keyframes shooting-stars {
  0% {
    background-position: 0% 0%;
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    background-position: -200% -200%;
    opacity: 0.3;
  }
}

.chat-manager__trigger:hover {
  transform: scale(1.1);
  box-shadow: 
    0 0 30px rgba(255, 20, 147, 0.7),
    0 6px 16px rgba(0, 0, 0, 0.4);
}

.chat-manager__trigger--unread {
  animation: pulse-neon 2s infinite;
}

@keyframes pulse-neon {
  0%, 100% { 
    box-shadow: 
      0 0 20px rgba(255, 20, 147, 0.5),
      0 4px 12px rgba(0, 0, 0, 0.3);
  }
  50% { 
    box-shadow: 
      0 0 40px rgba(255, 20, 147, 0.8),
      0 6px 20px rgba(255, 20, 147, 0.4);
  }
}

.chat-manager__badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: linear-gradient(135deg, #FF1493, #FF69B4);
  color: white;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  border: none;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.5);
}

.chat-manager__user-list {
  position: fixed;
  bottom: 0;
  right: 20px;
  width: 360px;
  max-height: 480px;
  background: rgba(15, 10, 20, 0.95);
  border: 1px solid rgba(255, 20, 147, 0.4);
  border-radius: 12px 12px 0 0;
  box-shadow: 
    0 0 30px rgba(255, 20, 147, 0.3),
    0 4px 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  z-index: 10001;
}

.chat-manager__list-header {
  padding: 16px;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.3), rgba(255, 20, 147, 0.2));
  border-bottom: 1px solid rgba(255, 20, 147, 0.3);
  color: #FF1493;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-manager__list-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  text-shadow: 0 0 10px rgba(255, 20, 147, 0.5);
}

.chat-manager__close {
  background: rgba(255, 20, 147, 0.2);
  border: 1px solid rgba(255, 20, 147, 0.3);
  font-size: 20px;
  color: #FF1493;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.chat-manager__close:hover {
  background: rgba(255, 20, 147, 0.3);
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.4);
  transform: rotate(90deg);
}

.chat-manager__search {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 20, 147, 0.2);
  background: rgba(10, 10, 20, 0.5);
}

.chat-manager__search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 20px;
  font-size: 14px;
  background: rgba(10, 10, 20, 0.8);
  color: #e8edff;
  transition: all 0.2s ease;
}

.chat-manager__search-input::placeholder {
  color: rgba(255, 20, 147, 0.5);
}

.chat-manager__search-input:focus {
  outline: none;
  border-color: rgba(255, 20, 147, 0.6);
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.3);
}

.chat-manager__users {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.chat-manager__users::-webkit-scrollbar {
  width: 8px;
}

.chat-manager__users::-webkit-scrollbar-track {
  background: rgba(10, 10, 20, 0.5);
}

.chat-manager__users::-webkit-scrollbar-thumb {
  background: rgba(255, 20, 147, 0.4);
  border-radius: 4px;
}

.chat-manager__users::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 20, 147, 0.6);
}

.chat-manager__user-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid rgba(255, 20, 147, 0.1);
}

.chat-manager__user-item:hover {
  background: rgba(255, 20, 147, 0.1);
  transform: translateX(4px);
}

.chat-manager__user-item--unread {
  background: rgba(255, 20, 147, 0.12);
  border-left: 3px solid rgba(255, 20, 147, 0.6);
}

.chat-manager__user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(255, 20, 147, 0.6));
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
}

.chat-manager__user-info {
  flex: 1;
}

.chat-manager__user-name {
  font-size: 14px;
  font-weight: 500;
  color: #e8edff;
}

.chat-manager__user-badge {
  background: linear-gradient(135deg, #FF1493, #FF69B4);
  color: white;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
  border: none;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.4);
}

.chat-manager__windows {
  position: fixed;
  bottom: 0;
  right: 0;
  pointer-events: none;
}

.chat-manager__windows > * {
  pointer-events: all;
}

.chat-manager__toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(15, 10, 20, 0.95);
  border: 1px solid rgba(255, 20, 147, 0.4);
  border-radius: 12px;
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.3),
    0 4px 12px rgba(0, 0, 0, 0.3);
  padding: 12px 16px;
  min-width: 300px;
  max-width: 400px;
  animation: slideInRight 0.3s ease-out;
  z-index: 10002;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.chat-manager__toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-manager__toast-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(255, 20, 147, 0.6));
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.3);
}

.chat-manager__toast-info {
  flex: 1;
  overflow: hidden;
}

.chat-manager__toast-name {
  font-size: 14px;
  font-weight: 600;
  color: #FF1493;
  margin-bottom: 2px;
  text-shadow: 0 0 5px rgba(255, 20, 147, 0.3);
}

.chat-manager__toast-message {
  font-size: 13px;
  color: rgba(232, 237, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
