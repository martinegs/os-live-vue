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
.modal-backdrop{
  position:fixed;
  inset:0;
  display:flex;
  align-items:flex-start; /* aparecer más arriba */
  justify-content:center;
  padding-top:64px; /* separación superior */
  background:linear-gradient(rgba(3,7,18,0.6), rgba(3,7,18,0.7));
  z-index:1000;
}
.modal-card{
  background:linear-gradient(180deg, rgba(15,23,42,0.98), rgba(8,12,28,0.96));
  color:var(--text,#e6eef8);
  width:80%;
  max-width:900px;
  min-width:480px;
  border-radius:18px;
  box-shadow:0 40px 140px rgba(2,6,23,0.9), inset 0 1px 0 rgba(255,255,255,0.02);
  border:1px solid rgba(94,234,212,0.06);
  overflow:hidden;
  transform-origin:center center;
  transition:transform .2s cubic-bezier(.2,.8,.2,1), opacity .18s ease;
}
.modal-header{display:flex;align-items:center;gap:16px;padding:18px 22px;border-bottom:1px solid rgba(255,255,255,0.03)}
.modal-title{margin:0;font-size:20px;color:#e6eef8;flex:1}
.modal-header .close{background:none;border:0;font-size:26px;line-height:1;cursor:pointer;color:rgba(226,232,240,0.75)}
.logo-chip{width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#0ea5e9);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;box-shadow:0 12px 30px rgba(124,58,237,0.25)}
.modal-content{display:flex;padding:22px 28px}
.modal-body{width:100%;display:flex;flex-direction:column;gap:14px}
.field{display:flex;flex-direction:column}
.field-label{font-size:13px;color:rgba(226,232,240,0.85);margin-bottom:6px}
.field-input{padding:14px;border:1px solid rgba(148,163,184,0.06);border-radius:12px;background:rgba(255,255,255,0.02);color:#e6eef8;font-size:15px}
.actions{display:flex;gap:12px;justify-content:flex-end;margin-top:8px}
.actions .primary{padding:14px 18px;border-radius:12px;border:0;cursor:pointer;font-weight:700;background:linear-gradient(90deg,#06b6d4,#7c3aed);color:white;box-shadow:0 8px 30px rgba(124,58,237,0.14)}
.actions .secondary{padding:12px 16px;border-radius:12px;background:transparent;border:1px solid rgba(148,163,184,0.06);color:rgba(226,232,240,0.85);cursor:pointer}
.actions button:disabled{opacity:0.6;cursor:not-allowed}
.error{color:#ff6b6b;margin-top:6px;font-size:13px}

@media (max-width: 900px){
  .modal-card{min-width:360px}
}

@media (max-width: 640px){
  .modal-card{width:calc(100% - 32px);min-width:auto;border-radius:12px}
  .modal-backdrop{padding-top:18px}
}

.modal-card[role="document"]{transform:scale(1);opacity:1}
</style>
