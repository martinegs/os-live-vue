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
      <div class="stats-card__header">
        <div>
          <h3 class="stats-card__title">Finanzas Realizadas</h3>
          <p class="stats-card__subtitle">Ventas vs Gastos pagados</p>
        </div>
        <span class="stats-card__badge">{{ formatCurrency(realizadas.ventas + realizadas.gastos) }}</span>
      </div>
      <div v-if="loadingRealizadas" class="stats-card__loading">Cargando...</div>
      <div v-else class="stats-card__pie-container">
        <div class="stats-pie-wrap">
          <canvas ref="realizadasChartRef" class="stats-pie__canvas" aria-hidden="true"></canvas>
          <div class="stats-pie__center">
            <div class="stats-pie__value">{{ formatCurrency(realizadas.ventas + realizadas.gastos) }}</div>
            <div class="stats-pie__label">total</div>
          </div>
        </div>
        <ul class="stats-legend-list">
          <li class="stats-legend-item">
            <span class="stats-legend__dot" style="background: #FF1493; box-shadow: 0 0 12px rgba(255, 20, 147, 0.6);"></span>
            <div class="stats-legend__content">
              <span class="stats-legend__label">Ventas</span>
              <span class="stats-legend__value">{{ formatCurrency(realizadas.ventas) }}</span>
              <span class="stats-legend__percent">{{ getRealizadasVentasPercent() }}%</span>
            </div>
          </li>
          <li class="stats-legend-item">
            <span class="stats-legend__dot" style="background: #00FFFF; box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);"></span>
            <div class="stats-legend__content">
              <span class="stats-legend__label">Gastos</span>
              <span class="stats-legend__value">{{ formatCurrency(realizadas.gastos) }}</span>
              <span class="stats-legend__percent">{{ getRealizadasGastosPercent() }}%</span>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 3. Pendientes (Ventas vs Gastos no pagados) -->
    <div class="stats-card dt-card dt-card--glow">
      <div class="stats-card__header">
        <div>
          <h3 class="stats-card__title">Finanzas Pendientes</h3>
          <p class="stats-card__subtitle">Ventas vs Gastos por cobrar</p>
        </div>
        <span class="stats-card__badge">{{ formatCurrency(pendientes.ventas + pendientes.gastos) }}</span>
      </div>
      <div v-if="loadingPendientes" class="stats-card__loading">Cargando...</div>
      <div v-else class="stats-card__pie-container">
        <div class="stats-pie-wrap">
          <canvas ref="pendientesChartRef" class="stats-pie__canvas" aria-hidden="true"></canvas>
          <div class="stats-pie__center">
            <div class="stats-pie__value">{{ formatCurrency(pendientes.ventas + pendientes.gastos) }}</div>
            <div class="stats-pie__label">pendiente</div>
          </div>
        </div>
        <ul class="stats-legend-list">
          <li class="stats-legend-item">
            <span class="stats-legend__dot" style="background: #FF1493; box-shadow: 0 0 12px rgba(255, 20, 147, 0.6);"></span>
            <div class="stats-legend__content">
              <span class="stats-legend__label">Ventas</span>
              <span class="stats-legend__value">{{ formatCurrency(pendientes.ventas) }}</span>
              <span class="stats-legend__percent">{{ getPendientesVentasPercent() }}%</span>
            </div>
          </li>
          <li class="stats-legend-item">
            <span class="stats-legend__dot" style="background: #00FFFF; box-shadow: 0 0 12px rgba(0, 255, 255, 0.6);"></span>
            <div class="stats-legend__content">
              <span class="stats-legend__label">Gastos</span>
              <span class="stats-legend__value">{{ formatCurrency(pendientes.gastos) }}</span>
              <span class="stats-legend__percent">{{ getPendientesGastosPercent() }}%</span>
            </div>
          </li>
        </ul>
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
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
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

const realizadasChartRef = ref(null);
const pendientesChartRef = ref(null);

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

function getRealizadasVentasPercent() {
  if (realizadasTotal.value === 0) return 0;
  return Math.round((realizadas.value.ventas / realizadasTotal.value) * 100);
}

function getRealizadasGastosPercent() {
  if (realizadasTotal.value === 0) return 0;
  return Math.round((realizadas.value.gastos / realizadasTotal.value) * 100);
}

function getPendientesVentasPercent() {
  if (pendientesTotal.value === 0) return 0;
  return Math.round((pendientes.value.ventas / pendientesTotal.value) * 100);
}

function getPendientesGastosPercent() {
  if (pendientesTotal.value === 0) return 0;
  return Math.round((pendientes.value.gastos / pendientesTotal.value) * 100);
}

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
      await nextTick();
      renderAllCharts();
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
      await nextTick();
      renderAllCharts();
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

function renderDonutChart(canvasRef, data, colors) {
  const canvas = canvasRef;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(160, rect.width * dpr);
  canvas.height = Math.max(160, rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const total = data.reduce((a, b) => a + b, 0) || 1;
  let startAngle = -0.5 * Math.PI;
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(cx, cy) - 8;
  const innerRadius = radius * 0.62;

  if (total === 0 || radius <= 0) return;

  data.forEach((value, i) => {
    const angle = (value / total) * 2 * Math.PI;
    const color = colors[i];

    const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, innerRadius * 0.3, cx, cy, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
    ctx.closePath();

    ctx.save();
    ctx.shadowColor = hexToRgba(color, 0.6);
    ctx.shadowBlur = 20;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(11, 16, 32, 0.65)';
    ctx.stroke();

    startAngle += angle;
  });

  ctx.beginPath();
  ctx.fillStyle = 'rgba(10, 10, 20, 0.9)';
  ctx.arc(cx, cy, innerRadius, 0, 2 * Math.PI);
  ctx.fill();
}

function hexToRgba(hex, alpha = 1) {
  try {
    const h = hex.replace('#', '').trim();
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return hex;
  }
}

function renderAllCharts() {
  nextTick(() => {
    if (realizadasChartRef.value) {
      renderDonutChart(realizadasChartRef.value, [realizadas.value.ventas, realizadas.value.gastos], ['#FF1493', '#00FFFF']);
    }
    if (pendientesChartRef.value) {
      renderDonutChart(pendientesChartRef.value, [pendientes.value.ventas, pendientes.value.gastos], ['#FF1493', '#00FFFF']);
    }
  });
}

onMounted(() => {
  fetchAllStats();
  nextTick(() => {
    window.addEventListener('resize', renderAllCharts);
  });
});

watch([realizadas, pendientes], () => {
  nextTick(() => renderAllCharts());
}, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderAllCharts);
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
  text-shadow: 0 0 8px rgba(255, 20, 147, 0.5);
  box-shadow: 0 0 12px rgba(255, 20, 147, 0.2);
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 20, 147, 0.2); }
  50% { box-shadow: 0 0 20px rgba(255, 20, 147, 0.4); }
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
  background: linear-gradient(90deg, #FF1493, #FF69B4, #FF1493);
  background-size: 200% 100%;
  animation: gradient-flow 3s ease infinite;
  transition: width 0.5s ease;
  box-shadow: 
    0 0 15px rgba(255, 20, 147, 0.6),
    0 0 30px rgba(255, 20, 147, 0.3),
    inset 0 0 20px rgba(255, 20, 147, 0.4);
  position: relative;
}

.stats-bar__fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes gradient-flow {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 200%; }
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
  gap: 20px;
}

.stats-pie-wrap {
  position: relative;
  width: 100%;
  max-width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 25px rgba(255, 20, 147, 0.3));
}

.stats-pie__canvas {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: rgba(10, 10, 20, 0.6);
  box-shadow: inset 0 2px 15px rgba(255, 20, 147, 0.1);
}

.stats-pie__center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.stats-pie__value {
  font-size: 16px;
  font-weight: 700;
  color: #FF1493;
  text-shadow: 
    0 0 15px rgba(255, 20, 147, 0.8),
    0 0 30px rgba(255, 20, 147, 0.5);
  animation: glow-value 3s ease-in-out infinite;
}

@keyframes glow-value {
  0%, 100% { 
    text-shadow: 
      0 0 15px rgba(255, 20, 147, 0.8),
      0 0 30px rgba(255, 20, 147, 0.5);
  }
  50% { 
    text-shadow: 
      0 0 25px rgba(255, 20, 147, 1),
      0 0 50px rgba(255, 20, 147, 0.7);
  }
}

.stats-pie__label {
  font-size: 10px;
  color: rgba(255, 20, 147, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-top: 4px;
}

.stats-legend-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.stats-legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: rgba(15, 10, 20, 0.5);
  border-radius: var(--dt-radius-md);
  border: 1px solid rgba(255, 20, 147, 0.2);
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.08);
  transition: all 0.3s ease;
}

.stats-legend-item:hover {
  border-color: rgba(255, 20, 147, 0.4);
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.15);
  transform: translateX(4px);
}

.stats-legend__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.stats-legend__content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.stats-legend__label {
  font-size: 13px;
  color: var(--dt-color-text-primary);
  font-weight: 500;
  flex: 1;
}

.stats-legend__value {
  font-weight: 700;
  color: #FF1493;
  font-size: 14px;
  text-shadow: 0 0 8px rgba(255, 20, 147, 0.5);
}

.stats-legend__percent {
  font-size: 11px;
  color: var(--dt-color-text-muted);
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(255, 20, 147, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 20, 147, 0.2);
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
  border: 1px solid rgba(255, 20, 147, 0.4);
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.3), rgba(0, 255, 255, 0.3));
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.4),
    inset 0 0 20px rgba(255, 20, 147, 0.2);
  text-shadow: 
    0 0 10px rgba(255, 20, 147, 0.8),
    0 0 20px rgba(255, 20, 147, 0.5);
  transition: all 0.3s ease;
  animation: pulse-bar 3s ease-in-out infinite;
}

.stats-bar-group__bar:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 0 30px rgba(255, 20, 147, 0.6),
    inset 0 0 30px rgba(255, 20, 147, 0.3);
}

@keyframes pulse-bar {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 20, 147, 0.4), inset 0 0 20px rgba(255, 20, 147, 0.2); }
  50% { box-shadow: 0 0 30px rgba(255, 20, 147, 0.6), inset 0 0 30px rgba(255, 20, 147, 0.3); }
}
</style>
