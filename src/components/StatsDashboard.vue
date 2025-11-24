<template>
  <section class="stats-dashboard">
    <!-- 1. Metros por Usuario -->
    <div class="stats-card dt-card dt-card--glow">
      <h3 class="stats-card__title">Metros Vendidos - {{ monthName }}</h3>
      <div v-if="loadingMetros" class="stats-card__loading">Cargando...</div>
      <div v-else-if="metrosData.length === 0" class="stats-card__empty">Sin datos</div>
      <div v-else class="stats-card__chart">
        <div 
          v-for="item in metrosData" 
          :key="item.usuario"
          class="stats-bar"
        >
          <div class="stats-bar__label">{{ item.usuario }}</div>
          <div class="stats-bar__track">
            <div 
              class="stats-bar__fill" 
              :style="{ width: getBarWidth(item.metros, maxMetros) + '%' }"
            ></div>
          </div>
          <div class="stats-bar__value">{{ formatNumber(item.metros) }} m</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useDateTime } from '@/composables/useDateTime';

const { getCurrentDate } = useDateTime();

const props = defineProps({
  apiOrigin: {
    type: String,
    default: '',
  },
  selectedDate: {
    type: String,
    default: '',
  },
});

const metrosData = ref([]);

const loadingMetros = ref(false);

const monthName = computed(() => {
  const dateStr = props.selectedDate || getCurrentDate().toISOString().slice(0, 10);
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
});

const maxMetros = computed(() => {
  if (metrosData.value.length === 0) return 0;
  return Math.max(...metrosData.value.map(item => item.metros));
});

function getBarWidth(value, max) {
  if (max === 0) return 0;
  return (value / max) * 100;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}

async function fetchAllStats() {
  const dateStr = props.selectedDate || getCurrentDate().toISOString().slice(0, 10);
  const origin = (props.apiOrigin || '').replace(/\/$/, '');

  // Metros por usuario
  loadingMetros.value = true;
  try {
    const res = await fetch(`${origin}/api/stats/metros-por-usuario?date=${dateStr}`, { credentials: 'omit' });
    if (res.ok) {
      const data = await res.json();
      metrosData.value = data.data || [];
    }
  } catch (err) {
    console.error('[StatsDashboard] Error fetching metros:', err);
  } finally {
    loadingMetros.value = false;
  }
}

onMounted(() => {
  fetchAllStats();
});

watch(() => props.selectedDate, () => {
  fetchAllStats();
});
</script>

<style scoped>
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--dt-gap-lg);
  margin-top: var(--dt-gap-lg);
}

.stats-card {
  padding: var(--dt-gap-md);
  min-height: 300px;
  background: transparent !important;
  border: 1px solid rgba(255, 20, 147, 0.15) !important;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.08) !important;
}

.stats-card__title {
  margin: 0;
  font-size: var(--dt-font-size-lg);
  font-weight: 600;
  color: var(--dt-color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(255, 20, 147, 0.4);
}

.stats-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.stats-card__subtitle {
  margin: 4px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.stats-card__badge {
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 20, 147, 0.15);
  border: 1px solid rgba(255, 20, 147, 0.35);
  color: #FF1493;
  font-size: var(--dt-font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  text-shadow: 0 0 6px rgba(255, 20, 147, 0.4);
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.2);
}

.stats-card__loading,
.stats-card__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--dt-color-text-secondary);
}

.stats-card__chart {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
}

.stats-bar {
  display: grid;
  grid-template-columns: 120px 1fr 80px;
  align-items: center;
  gap: var(--dt-gap-sm);
}

.stats-bar__label {
  font-size: 0.875rem;
  color: var(--dt-color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stats-bar__track {
  height: 24px;
  background: rgba(15, 10, 20, 0.9);
  border-radius: var(--dt-radius-sm);
  overflow: hidden;
  border: 1px solid rgba(255, 20, 147, 0.3);
  box-shadow: inset 0 0 10px rgba(255, 20, 147, 0.15);
}

.stats-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #FF1493, #FF69B4);
  transition: width 0.5s ease;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.5);
  position: relative;
  will-change: width;
}



.stats-bar__value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dt-color-text);
  text-align: right;
}
</style>
