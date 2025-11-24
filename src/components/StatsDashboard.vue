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

    <!-- 2. Realizadas (Ventas vs Gastos pagados) -->
    <div class="stats-card dt-card dt-card--glow">
      <h3 class="stats-card__title">Finanzas Realizadas</h3>
      <div v-if="loadingRealizadas" class="stats-card__loading">Cargando...</div>
      <div v-else class="stats-card__pie-container">
        <div class="stats-pie">
          <svg viewBox="0 0 100 100" class="stats-pie__chart">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#22c55e"
              :stroke-dasharray="`${realizadasVentasPercent} ${100 - realizadasVentasPercent}`"
              stroke-width="20"
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#ef4444"
              :stroke-dasharray="`${realizadasGastosPercent} ${100 - realizadasGastosPercent}`"
              :stroke-dashoffset="-realizadasVentasPercent"
              stroke-width="20"
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>
        <div class="stats-legend">
          <div class="stats-legend__item">
            <span class="stats-legend__dot" style="background: #22c55e;"></span>
            <span>Ventas: {{ formatCurrency(realizadas.ventas) }}</span>
          </div>
          <div class="stats-legend__item">
            <span class="stats-legend__dot" style="background: #ef4444;"></span>
            <span>Gastos: {{ formatCurrency(realizadas.gastos) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Pendientes (Ventas vs Gastos no pagados) -->
    <div class="stats-card dt-card dt-card--glow">
      <h3 class="stats-card__title">Finanzas Pendientes</h3>
      <div v-if="loadingPendientes" class="stats-card__loading">Cargando...</div>
      <div v-else class="stats-card__pie-container">
        <div class="stats-pie">
          <svg viewBox="0 0 100 100" class="stats-pie__chart">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#eab308"
              :stroke-dasharray="`${pendientesVentasPercent} ${100 - pendientesVentasPercent}`"
              stroke-width="20"
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#f97316"
              :stroke-dasharray="`${pendientesGastosPercent} ${100 - pendientesGastosPercent}`"
              :stroke-dashoffset="-pendientesVentasPercent"
              stroke-width="20"
              transform="rotate(-90 50 50)"
            />
          </svg>
        </div>
        <div class="stats-legend">
          <div class="stats-legend__item">
            <span class="stats-legend__dot" style="background: #eab308;"></span>
            <span>Ventas: {{ formatCurrency(pendientes.ventas) }}</span>
          </div>
          <div class="stats-legend__item">
            <span class="stats-legend__dot" style="background: #f97316;"></span>
            <span>Gastos: {{ formatCurrency(pendientes.gastos) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. Previsión (En caja ahora vs A entrar) -->
    <div class="stats-card dt-card dt-card--glow">
      <h3 class="stats-card__title">Previsión de Caja</h3>
      <div v-if="loadingPrevision" class="stats-card__loading">Cargando...</div>
      <div v-else class="stats-card__bars">
        <div class="stats-bar-group">
          <div class="stats-bar-group__label">En Caja Ahora</div>
          <div class="stats-bar-group__bar" style="background: #22c55e;">
            <span>{{ formatCurrency(prevision.enCajaAhora) }}</span>
          </div>
        </div>
        <div class="stats-bar-group">
          <div class="stats-bar-group__label">A Entrar</div>
          <div class="stats-bar-group__bar" style="background: #3b82f6;">
            <span>{{ formatCurrency(prevision.aEntrar) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useDateTime } from '@/composables/useDateTime';

const { getCurrentDate } = useDateTime();

const props = defineProps({
  apiOrigin: {
    type: String,
    default: '',
  },
});

const metrosData = ref([]);
const realizadas = ref({ ventas: 0, gastos: 0 });
const pendientes = ref({ ventas: 0, gastos: 0 });
const prevision = ref({ enCajaAhora: 0, aEntrar: 0 });

const loadingMetros = ref(false);
const loadingRealizadas = ref(false);
const loadingPendientes = ref(false);
const loadingPrevision = ref(false);

const monthName = computed(() => {
  const date = getCurrentDate();
  return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
});

const maxMetros = computed(() => {
  if (metrosData.value.length === 0) return 0;
  return Math.max(...metrosData.value.map(item => item.metros));
});

const realizadasTotal = computed(() => realizadas.value.ventas + realizadas.value.gastos);
const realizadasVentasPercent = computed(() => {
  if (realizadasTotal.value === 0) return 50;
  return (realizadas.value.ventas / realizadasTotal.value) * 100;
});
const realizadasGastosPercent = computed(() => {
  if (realizadasTotal.value === 0) return 50;
  return (realizadas.value.gastos / realizadasTotal.value) * 100;
});

const pendientesTotal = computed(() => pendientes.value.ventas + pendientes.value.gastos);
const pendientesVentasPercent = computed(() => {
  if (pendientesTotal.value === 0) return 50;
  return (pendientes.value.ventas / pendientesTotal.value) * 100;
});
const pendientesGastosPercent = computed(() => {
  if (pendientesTotal.value === 0) return 50;
  return (pendientes.value.gastos / pendientesTotal.value) * 100;
});

function getBarWidth(value, max) {
  if (max === 0) return 0;
  return (value / max) * 100;
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(value);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(value);
}

async function fetchAllStats() {
  const dateStr = getCurrentDate().toISOString().slice(0, 10);
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

  // Realizadas
  loadingRealizadas.value = true;
  try {
    const res = await fetch(`${origin}/api/lancamentos/realizadas?date=${dateStr}`, { credentials: 'omit' });
    if (res.ok) {
      const data = await res.json();
      realizadas.value = { ventas: data.ventas || 0, gastos: data.gastos || 0 };
    }
  } catch (err) {
    console.error('[StatsDashboard] Error fetching realizadas:', err);
  } finally {
    loadingRealizadas.value = false;
  }

  // Pendientes
  loadingPendientes.value = true;
  try {
    const res = await fetch(`${origin}/api/lancamentos/pendientes?date=${dateStr}`, { credentials: 'omit' });
    if (res.ok) {
      const data = await res.json();
      pendientes.value = { ventas: data.ventas || 0, gastos: data.gastos || 0 };
    }
  } catch (err) {
    console.error('[StatsDashboard] Error fetching pendientes:', err);
  } finally {
    loadingPendientes.value = false;
  }

  // Previsión
  loadingPrevision.value = true;
  try {
    const res = await fetch(`${origin}/api/lancamentos/prevision?date=${dateStr}`, { credentials: 'omit' });
    if (res.ok) {
      const data = await res.json();
      prevision.value = { enCajaAhora: data.enCajaAhora || 0, aEntrar: data.aEntrar || 0 };
    }
  } catch (err) {
    console.error('[StatsDashboard] Error fetching prevision:', err);
  } finally {
    loadingPrevision.value = false;
  }
}

onMounted(fetchAllStats);
</script>

<style scoped>
.stats-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--dt-gap-lg);
  margin-top: var(--dt-gap-lg);
}

.stats-card {
  padding: var(--dt-gap-lg);
  min-height: 300px;
}

.stats-card__title {
  margin: 0 0 var(--dt-gap-md);
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--dt-color-text);
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
  background: var(--dt-color-surface-secondary);
  border-radius: var(--dt-radius-sm);
  overflow: hidden;
}

.stats-bar__fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  transition: width 0.3s ease;
}

.stats-bar__value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--dt-color-text);
  text-align: right;
}

.stats-card__pie-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-gap-md);
}

.stats-pie {
  width: 150px;
  height: 150px;
}

.stats-pie__chart {
  width: 100%;
  height: 100%;
}

.stats-legend {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
}

.stats-legend__item {
  display: flex;
  align-items: center;
  gap: var(--dt-gap-sm);
  font-size: 0.875rem;
  color: var(--dt-color-text);
}

.stats-legend__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.stats-card__bars {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
}

.stats-bar-group {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-xs);
}

.stats-bar-group__label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--dt-color-text-secondary);
}

.stats-bar-group__bar {
  padding: var(--dt-gap-md);
  border-radius: var(--dt-radius-sm);
  color: white;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
}
</style>
