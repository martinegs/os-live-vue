<template>
  <div class="toolbar">
    <input
      v-model="query"
      type="search"
      class="input"
      :placeholder="placeholder"
      aria-label="Buscar órdenes"
    />
    <button type="button" class="toolbar-btn" @click="emit('create')">
      {{ buttonLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Buscar...",
  },
  buttonLabel: {
    type: String,
    default: "+ Nueva orden",
  },
});

const emit = defineEmits(["update:modelValue", "create"]);

// Bridge the toolbar input with the parent via v-model for a symmetric API.
const query = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-bottom: 20px;
}

.input {
  padding: 10px 14px;
  border-radius: 2px;
  flex: 1 1 320px;
  background: rgba(10, 10, 10, 0.9);
  border: 1px solid rgba(255, 20, 147, 0.3);
  color: #E8E8E8;
  font-family: 'Rajdhani', 'Courier New', monospace;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
  box-shadow: 
    0 0 12px rgba(255, 20, 147, 0.08),
    inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.input::placeholder {
  color: rgba(255, 20, 147, 0.35);
  letter-spacing: 0.1em;
}

.input:focus {
  outline: none;
  border-color: rgba(255, 20, 147, 0.6);
  background: rgba(15, 10, 12, 0.95);
  box-shadow:
    0 0 20px rgba(255, 20, 147, 0.3),
    0 0 35px rgba(255, 20, 147, 0.15),
    inset 0 0 20px rgba(255, 20, 147, 0.08);
  text-shadow: 0 0 4px rgba(255, 20, 147, 0.25);
}

.toolbar-btn {
  border: 1px solid rgba(255, 20, 147, 0.5);
  border-radius: 2px;
  padding: 10px 18px;
  margin-left: auto;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.25), rgba(0, 0, 0, 0.9));
  color: #FF1493;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 700;
  font-family: 'Rajdhani', 'Orbitron', monospace;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  text-shadow: 
    0 0 8px rgba(255, 20, 147, 0.6),
    0 0 15px rgba(255, 20, 147, 0.3);
  box-shadow: 
    0 0 15px rgba(255, 20, 147, 0.2),
    inset 0 0 12px rgba(255, 20, 147, 0.08);
}

.toolbar-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 20, 147, 0.7), transparent);
}

.toolbar-btn:hover {
  transform: translateY(-2px);
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.4), rgba(0, 0, 0, 0.95));
  border-color: rgba(255, 20, 147, 0.8);
  box-shadow: 
    0 0 25px rgba(255, 20, 147, 0.45),
    0 0 45px rgba(255, 20, 147, 0.25),
    inset 0 0 20px rgba(255, 20, 147, 0.15);
  text-shadow: 
    0 0 12px rgba(255, 20, 147, 0.9),
    0 0 25px rgba(255, 20, 147, 0.5);
}

@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    gap: 12px;
  }

  .toolbar-btn {
    margin-left: 0;
    width: 100%;
  }
}
</style>
