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
  border-radius: 14px;
  flex: 1 1 320px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #e2e8f0;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.input::placeholder {
  color: rgba(148, 163, 184, 0.6);
}

.input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.25),
    0 0 18px rgba(37, 99, 235, 0.35);
}

.toolbar-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  margin-left: auto;
  flex-shrink: 0;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.65), rgba(37, 99, 235, 0.65));
  color: #f8fafc;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.toolbar-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(236, 72, 153, 0.45);
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
