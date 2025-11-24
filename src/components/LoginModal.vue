<template>
  <div class="modal-backdrop" @click.self="close" role="dialog" aria-modal="true">
    <div class="modal-card" role="document">
      <header class="modal-header">
        <div class="logo-chip">DT</div>
        <h2 class="modal-title">Iniciar sesión en DigitalTex Ops</h2>
        <button class="close" @click="close" aria-label="Cerrar">×</button>
      </header>

      <div class="modal-content">
        <form @submit.prevent="onSubmit" class="modal-body">
          <label class="field">
            <span class="field-label">Email</span>
            <input class="field-input" v-model="email" type="text" required autocomplete="username" />
          </label>

          <label class="field">
            <span class="field-label">Contraseña</span>
            <input class="field-input" v-model="senha" type="password" required autocomplete="current-password" />
          </label>

          <div class="actions">
            <button class="primary" type="submit" :disabled="loading">Entrar</button>
            <button class="secondary" type="button" @click="close">Cancelar</button>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { login } from '../services/authService';
const emit = defineEmits(['success','close']);

const email = ref('');
const senha = ref('');
const loading = ref(false);
const error = ref(null);

function close() {
  emit('close');
}

async function onSubmit() {
  loading.value = true;
  error.value = null;
  try {
    const res = await login(email.value, senha.value);
    emit('success', res.user || null);
  } catch (err) {
    error.value = err.message || String(err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 64px;
  background: rgba(10, 10, 20, 0.92);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.modal-card {
  background: rgba(15, 10, 20, 0.95);
  color: #e8edff;
  width: 80%;
  max-width: 900px;
  min-width: 480px;
  border-radius: 16px;
  box-shadow:
    0 0 30px rgba(255, 20, 147, 0.3),
    0 24px 60px rgba(0, 0, 0, 0.5),
    inset 0 0 20px rgba(255, 20, 147, 0.08);
  border: 1px solid rgba(255, 20, 147, 0.4);
  overflow: hidden;
  transform-origin: center center;
  transition: transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.18s ease;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 20, 147, 0.2);
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.15), rgba(255, 20, 147, 0.08));
}

.modal-title {
  margin: 0;
  font-size: 20px;
  color: #FF1493;
  flex: 1;
  text-shadow: 0 0 10px rgba(255, 20, 147, 0.5);
  letter-spacing: 0.08em;
}

.modal-header .close {
  background: rgba(255, 20, 147, 0.2);
  border: 1px solid rgba(255, 20, 147, 0.3);
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  color: #FF1493;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-header .close:hover {
  background: rgba(255, 20, 147, 0.3);
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.4);
  transform: rotate(90deg);
}

.logo-chip {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.6), rgba(255, 20, 147, 0.8));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
  border: none;
}

.modal-content {
  display: flex;
  padding: 22px 28px;
}

.modal-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
}

.field-label {
  font-size: 13px;
  color: rgba(255, 20, 147, 0.8);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.field-input {
  padding: 14px;
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 10px;
  background: rgba(10, 10, 20, 0.8);
  color: #e6eef8;
  font-size: 15px;
  transition: all 0.2s ease;
  box-shadow: inset 0 0 10px rgba(255, 20, 147, 0.05);
}

.field-input:focus {
  outline: none;
  border-color: rgba(255, 20, 147, 0.6);
  box-shadow:
    0 0 0 2px rgba(255, 20, 147, 0.15),
    0 0 20px rgba(255, 20, 147, 0.3),
    inset 0 0 15px rgba(255, 20, 147, 0.1);
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}

.actions .primary {
  padding: 14px 18px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  font-weight: 700;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(255, 20, 147, 0.6));
  color: white;
  border: 1px solid rgba(255, 20, 147, 0.5);
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.4),
    inset 0 0 15px rgba(255, 20, 147, 0.2);
  text-shadow: 0 0 10px rgba(255, 20, 147, 0.8);
  transition: all 0.2s ease;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.actions .primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 
    0 0 30px rgba(255, 20, 147, 0.6),
    inset 0 0 20px rgba(255, 20, 147, 0.3);
  border-color: rgba(255, 20, 147, 0.7);
}

.actions .secondary {
  padding: 12px 16px;
  border-radius: 999px;
  background: rgba(15, 10, 20, 0.6);
  border: 1px solid rgba(255, 20, 147, 0.25);
  color: rgba(226, 232, 240, 0.85);
  cursor: pointer;
  transition: all 0.2s ease;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.actions .secondary:hover {
  transform: translateY(-1px);
  border-color: rgba(255, 20, 147, 0.4);
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
}

.actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: #FF69B4;
  margin-top: 6px;
  font-size: 13px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(255, 20, 147, 0.15);
  border: 1px solid rgba(255, 20, 147, 0.4);
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.2);
}

@media (max-width: 900px) {
  .modal-card {
    min-width: 360px;
  }
}

@media (max-width: 640px) {
  .modal-card {
    width: calc(100% - 32px);
    min-width: auto;
    border-radius: 12px;
  }
  .modal-backdrop {
    padding-top: 18px;
  }
}

.modal-card[role="document"] {
  transform: scale(1);
  opacity: 1;
}
</style>
