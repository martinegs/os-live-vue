<template>
  <div class="status">
    <div>
      API:
      <span class="status-pill" :class="{ 'status-pill--ok': apiOnline }">
        {{ apiStatus }}
      </span>
    </div>
    <div>
      SSE:
      <span class="status-pill" :class="{ 'status-pill--ok': sseOnline }">
        {{ sseStatus }}
      </span>
    </div>
    <small class="status-muted">| Estado: {{ estado }}</small>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  apiStatus: {
    type: String,
    default: "",
  },
  sseStatus: {
    type: String,
    default: "",
  },
  estado: {
    type: String,
    default: "",
  },
});

const apiOnline = computed(() => props.apiStatus.toLowerCase() === "conectado");
const sseOnline = computed(() => props.sseStatus.toLowerCase() === "conectado");
</script>

<style scoped>
.status {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 13px;
  margin-bottom: 16px;
  color: rgba(226, 232, 240, 0.75);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #ea4335;
  min-width: 90px;
  margin-left: 6px;
}

.status-pill--ok {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(34, 197, 94, 0.4);
  color: #2e7d32;
}

.status-muted {
  opacity: 0.65;
}

@media (max-width: 768px) {
  .status {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
}
</style>
