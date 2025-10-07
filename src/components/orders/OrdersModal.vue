<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      <header class="modal-header">
        <h3>{{ isCreate ? "Nueva orden" : `Editar orden #${editing.form.id}` }}</h3>
        <button type="button" class="modal-close" @click="emit('close')" aria-label="Cerrar editor">
          ×
        </button>
      </header>
      <form class="modal-body" @submit.prevent="emit('submit')">
        <div class="form-grid">
          <label class="form-field">
            <span>ID</span>
            <input type="number" v-model="editing.form.id" readonly />
          </label>
          <label class="form-field">
            <span>Estado</span>
            <input type="text" v-model="editing.form.status" />
          </label>
          <label class="form-field">
            <span>Estado pago</span>
            <input type="text" v-model="editing.form.statusPago" />
          </label>
          <label class="form-field">
            <span>Valor total (ARS)</span>
            <input type="number" step="0.01" v-model="editing.form.valorTotal" />
          </label>
          <label class="form-field">
            <span>Valor pagado (ARS)</span>
            <input type="number" step="0.01" v-model="editing.form.valorPagado" />
          </label>
          <label class="form-field">
            <span>Pendiente</span>
            <input type="text" v-model="editing.form.pendiente" />
          </label>
          <label class="form-field">
            <span>Metros</span>
            <input type="text" v-model="editing.form.metros" />
          </label>
          <label class="form-field">
            <span>Seña</span>
            <input type="text" v-model="editing.form.senia" />
          </label>
          <label class="form-field">
            <span>Lugar</span>
            <input type="text" v-model="editing.form.lugares_id" />
          </label>
          <label class="form-field">
            <span>Fecha evento</span>
            <input type="datetime-local" v-model="editing.form.ts" />
          </label>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>ID cliente</span>
            <input type="text" v-model="editing.form.cliente_id" />
          </label>
          <label class="form-field">
            <span>Nombre cliente</span>
            <input type="text" v-model="editing.form.cliente_nombre" />
          </label>
          <label class="form-field">
            <span>Área</span>
            <input type="text" v-model="editing.form.area" />
          </label>
          <label class="form-field">
            <span>Usuario ID</span>
            <input type="text" v-model="editing.form.usuario_id" />
          </label>
          <label class="form-field form-field--toggle">
            <span>Rehacer</span>
            <label class="form-toggle">
              <input type="checkbox" v-model="editing.form.es_rehacer" />
              <span>Marcar como rehacer</span>
            </label>
          </label>
        </div>

        <div class="form-grid">
          <label class="form-field">
            <span>Fecha ingreso</span>
            <input type="date" v-model="editing.form.fechaIngreso" />
          </label>
          <label class="form-field">
            <span>Entrega estimada</span>
            <input type="date" v-model="editing.form.fechaEntrega" />
          </label>
          <label class="form-field">
            <span>Lugar de entrega</span>
            <input type="text" v-model="editing.form.lugarEntrega" />
          </label>
          <label class="form-field">
            <span>Clase</span>
            <select v-model="editing.form.clase">
              <option value="seleccione">Seleccione</option>
              <option value="Solo Papel">Solo Papel</option>
              <option value="DTF + Marca">DTF + Marca</option>
              <option value="Tela + Sublimacion">Tela + Sublimacion</option>
              <option value="Tela de Cliente + Subli">Tela de Cliente + Subli</option>
              <option value="Confeccion">Confeccion</option>
              <option value="Otro">Otro</option>
            </select>
          </label>
          <label class="form-field">
            <span>Trabajo</span>
            <input type="text" v-model="editing.form.trabajo" />
          </label>
        </div>

        <div class="form-grid form-grid--full">
          <label class="form-field">
            <span>Tipo de trabajo / Producto</span>
            <textarea rows="3" v-model="editing.form.descripcionProducto"></textarea>
          </label>
          <label class="form-field">
            <span>Información general</span>
            <textarea rows="3" v-model="editing.form.informacionGeneral"></textarea>
          </label>
        </div>

        <p v-if="editing.error" class="form-error">{{ editing.error }}</p>

        <footer class="modal-actions">
          <button type="button" class="btn ghost" @click="emit('close')">Cancelar</button>
          <button type="submit" class="btn primary" :disabled="editing.saving">
            <span v-if="editing.saving" class="spinner"></span>
            <span>{{ submitLabel }}</span>
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  editing: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "submit"]);

const isCreate = computed(() => props.editing.mode === "create");

const submitLabel = computed(() => {
  if (props.editing.saving) {
    return isCreate.value ? "Creando..." : "Guardando...";
  }
  return isCreate.value ? "Crear orden" : "Guardar cambios";
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(9, 15, 29, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 24px 24px;
  z-index: 1000;
}

.modal-card {
  width: min(620px, 100%);
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(15, 23, 42, 0.95)),
    rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 16px;
  box-shadow:
    0 24px 60px rgba(37, 99, 235, 0.25),
    inset 0 0 18px rgba(30, 64, 175, 0.25);
  color: #e8edff;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.modal-close {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #f8fafc;
}

.modal-body {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px 18px;
}

.form-grid--full {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.85);
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.form-field textarea {
  resize: vertical;
  min-height: 90px;
}

.form-field select {
  cursor: pointer;
}

.form-field input[readonly] {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.25),
    0 0 14px rgba(37, 99, 235, 0.35);
}

.form-field--toggle {
  justify-content: flex-end;
}

.form-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0.08em;
  color: rgba(226, 232, 240, 0.8);
}

.form-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #ec4899;
}

.form-error {
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(248, 113, 113, 0.14);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #fecaca;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(14, 165, 233, 0.6));
  color: #f8fafc;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.45);
}

.btn.ghost {
  background: rgba(15, 23, 42, 0.6);
  color: rgba(226, 232, 240, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.btn.ghost:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.35);
}

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(240, 249, 255, 0.4);
  border-top-color: rgba(240, 249, 255, 0.95);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .modal-card {
    padding: 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
