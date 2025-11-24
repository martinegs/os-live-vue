<template>
  <section class="orders-insights dt-surface dt-surface--elevated">
    <header class="orders-insights__header">
      <div>
        <h2 class="orders-insights__title">Resumen en vivo</h2>
      </div>
    </header>

    <div class="orders-insights__visuals">
      <section class="orders-insights__chart">
        <header class="orders-insights__chart-header">
          <div>
            <h3>Distribución por estado</h3>
            <p>Detalle de ordenes activas {{ dateLabel }}</p>
          </div>
          <span class="orders-insights__tag">{{ statesActive }} estados</span>
        </header>
        <div class="orders-insights__chart-body">
          <div class="orders-insights__bars">
            <div
              v-for="item in estadoChartData"
              :key="item.label"
              class="orders-insights__bar"
            >
              <div class="orders-insights__bar-meta">
                <span class="orders-insights__dot" :style="{ background: item.color }"></span>
                <span class="orders-insights__bar-label">{{ item.label }}</span>
              </div>
              <div class="orders-insights__bar-track">
                <span
                  class="orders-insights__bar-fill"
                  :style="{ width: item.porcentaje.toFixed(0) + '%', background: item.color }"
                ></span>
              </div>
              <span class="orders-insights__bar-value">
                {{ item.cantidad }} ({{ item.porcentaje.toFixed(0) }}%)
              </span>
            </div>
          </div>
          <div class="orders-insights__pie" v-if="estadoPieSegments.length">
            <div class="orders-insights__pie-wrap">
              <canvas ref="estadoPieChartRef" class="orders-insights__pie-canvas" aria-hidden="true"></canvas>
              <div class="orders-insights__pie-center">
                <div class="orders-insights__pie-value">{{ statesActive }}</div>
                <div class="orders-insights__pie-label">estados</div>
              </div>
            </div>
            <ul class="orders-insights__legend">
              <li v-for="segment in estadoPieSegments" :key="segment.label" class="orders-insights__legend-item">
                <span class="orders-insights__dot" :style="{ background: segment.color, boxShadow: `0 0 12px ${segment.color}` }"></span>
                <div class="orders-insights__legend-content">
                  <span class="orders-insights__legend-label">{{ segment.label }}</span>
                  <span class="orders-insights__legend-value">{{ segment.cantidad }}</span>
                  <span class="orders-insights__legend-percent">{{ Math.round((segment.cantidad / ordersConsidered) * 100) }}%</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="pagoChartData.length" class="orders-insights__chart orders-insights__chart--secondary">
        <header class="orders-insights__chart-header">
          <div>
            <h3>Pagos registrados</h3>
            <p>Estados de cobros del dia</p>
          </div>
          <span class="orders-insights__tag">{{ ordersConsidered }} ordenes</span>
        </header>
        <div class="orders-insights__payments">
          <div v-for="item in pagoChartData" :key="item.label" class="orders-insights__payment-row">
            <div class="orders-insights__payment-meta">
              <span class="orders-insights__dot" :style="{ background: item.color }"></span>
              <span class="orders-insights__payment-label">{{ item.label }}</span>
            </div>
            <div class="orders-insights__payment-track">
              <span
                class="orders-insights__payment-fill"
                :style="{ width: item.porcentaje.toFixed(0) + '%', background: item.color }"
              ></span>
            </div>
            <span class="orders-insights__payment-value">
              {{ item.cantidad }} ({{ item.porcentaje.toFixed(0) }}%)
            </span>
          </div>
        </div>

        <div v-if="claseChartData.length" class="orders-insights__subsection">
          <header class="orders-insights__chart-header orders-insights__chart-header--compact">
            <div>
              <h3>Tipos de trabajo</h3>
            </div>
            <span class="orders-insights__tag">{{ claseChartData.length }} tipos</span>
          </header>
          <div class="orders-insights__payments">
            <div v-for="item in claseChartData" :key="item.label" class="orders-insights__payment-row">
              <div class="orders-insights__payment-meta">
                <span class="orders-insights__dot" :style="{ background: item.color }"></span>
                <span class="orders-insights__payment-label">{{ item.label }}</span>
              </div>
              <div class="orders-insights__payment-track">
                <span
                  class="orders-insights__payment-fill"
                  :style="{ width: item.porcentaje.toFixed(0) + '%', background: item.color }"
                ></span>
              </div>
              <span class="orders-insights__payment-value">
                {{ item.cantidad }} ({{ item.porcentaje.toFixed(0) }}%)
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>

  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch, onBeforeUnmount, nextTick } from "vue";
import { useDateTime } from '@/composables/useDateTime';

const { getCurrentDate } = useDateTime();

const estadoPieChartRef = ref(null);

const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
  statsToday: {
    type: Object,
    default: () => ({ totalOrdenes: 0, estadoTotal: 0 }),
  },
  estadoChartData: {
    type: Array,
    default: () => [],
  },
  estadoPieSegments: {
    type: Array,
    default: () => [],
  },
  pagoChartData: {
    type: Array,
    default: () => [],
  },
  claseChartData: {
    type: Array,
    default: () => [],
  },
  paymentsSummary: {
    type: Object,
    default: () => ({ aggregate: { totalNeto: 0 }, items: [] }),
  },
  formatCurrency: {
    type: Function,
    default: (value) => value,
  },
  rows: {
    type: Array,
    required: true,
  },
  selectedDate: {
    type: String,
    default: '',
  },
});

const dateLabel = computed(() => {
  if (!props.selectedDate) return 'hoy';
  const date = new Date(props.selectedDate + 'T12:00:00');
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'hoy';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
});

// Debug: ver qué datos llegan
watch(() => props.paymentsSummary, (newVal) => {
  console.log('[OrdersInsights] paymentsSummary updated:', JSON.stringify(newVal, null, 2));
}, { immediate: true, deep: true });

function currency(value) {
  return props.formatCurrency(value ?? 0);
}

const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

function formatNumber(value) {
  return numberFormatter.format(value ?? 0);
}

const todaysRows = computed(() => {
  const today = getCurrentDate().toISOString().slice(0, 10);
  return (props.rows || []).filter((row) => {
    const rawDate = row.fechaIngreso ?? row.ts ?? null;
    if (!rawDate) return false;
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.toISOString().slice(0, 10) === today;
  });
});

const todaysOrders = computed(() => todaysRows.value.length);

const todaysOrdersWithMeters = computed(
  () =>
    todaysRows.value.filter((row) => {
      const meters = Number(row.metros ?? 0);
      return Number.isFinite(meters) && meters > 0;
    }).length,
);

const todaysTicket = computed(() => {
  const rows = todaysRows.value;
  if (!rows.length) return currency(0);
  const total = rows.reduce((sum, row) => sum + (Number(row.valorTotal ?? 0) || 0), 0);
  return currency(total / rows.length);
});

const ordersTotal = computed(() => props.stats?.totalOrdenes ?? 0);
const totalFacturado = computed(() => props.stats?.totalFacturado ?? 0);
const statesActive = computed(
  () => props.statsToday?.estadoTotal ?? props.stats?.estadoTotal ?? 0,
);
const ordersConsidered = computed(
  () => props.statsToday?.totalOrdenes ?? props.stats?.totalOrdenes ?? 0,
);

const payTotals = ref([0, 0, 0, 0]);

function formatLocalDate(date) {
  const tzOffsetMs = date.getTimezoneOffset() * 60000;
  const localMidnight = new Date(date.getTime() - tzOffsetMs);
  return localMidnight.toISOString().slice(0, 10);
}

async function fetchPayTotalForDate(dateStr) {
  try {
    const isDev =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? (isDev ? "http://localhost:4000" : "");
    const baseApi = String(apiOrigin || "").replace(/\/$/, "");
    const url = `${baseApi}/api/lancamentos/summary?date=${encodeURIComponent(dateStr)}`;
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) {
      return 0;
    }
    const body = await response.json();
    return body?.totalNeto || 0;
  } catch (error) {
    console.warn("[OrdersInsights] error fetching payments", error);
    return 0;
  }
}

onMounted(async () => {
  const now = getCurrentDate();
  const dateOffsets = [3, 2, 1, 0];
  const dateStrings = dateOffsets.map((offset) =>
    formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)),
  );
  const results = await Promise.all(dateStrings.map((date) => fetchPayTotalForDate(date)));
  for (let i = 0; i < results.length; i += 1) {
    payTotals.value[i] = Number(results[i] ?? 0) || 0;
  }
});

function calculateProjection({ d3, d2, ayer, hoy }) {
  const values = [Number(d3 ?? 0), Number(d2 ?? 0), Number(ayer ?? 0), Number(hoy ?? 0)];
  const nonZero = values.filter((v) => v !== 0);
  if (values[3] > 0 && values[2] > 0) {
    const delta = values[3] - values[2];
    return Math.max(0, Math.round((values[3] + delta) * 100) / 100);
  }
  if (values[3] > 0 && values[2] <= 0) {
    return Math.round(values[3] * 100) / 100;
  }
  if (values[2] > 0 && values[3] <= 0) {
    return Math.round(values[2] * 100) / 100;
  }
  if (nonZero.length) {
    const average = nonZero.reduce((sum, value) => sum + value, 0) / nonZero.length;
    return Math.round(average * 100) / 100;
  }
  return 0;
}

const projectedTomorrow = computed(() => {
  const valores = {
    d3: payTotals.value[0],
    d2: payTotals.value[1],
    ayer: payTotals.value[2],
    hoy: payTotals.value[3],
  };
  const proy = calculateProjection(valores);
  console.log('[OrdersInsights] Proyección mañana:', {
    ...valores,
    proy
  });
  return proy;
});

function renderEstadoPieChart() {
  const canvas = estadoPieChartRef.value;
  if (!canvas || !props.estadoPieSegments.length) return;
  
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(160, rect.width * dpr);
  canvas.height = Math.max(160, rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const data = props.estadoPieSegments.map(s => s.cantidad);
  const colors = props.estadoPieSegments.map(s => s.color);
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

watch(() => props.estadoPieSegments, () => {
  nextTick(() => renderEstadoPieChart());
}, { deep: true });

onMounted(() => {
  nextTick(() => renderEstadoPieChart());
  window.addEventListener('resize', renderEstadoPieChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderEstadoPieChart);
});
</script>

<style scoped>
.orders-insights {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-xl);
  padding: var(--dt-gap-xl);
  border-radius: var(--dt-radius-lg);
}

.orders-insights__header {
  display: flex;
  justify-content: space-between;
  gap: var(--dt-gap-lg);
  flex-wrap: wrap;
}

.orders-insights__title {
  margin: 6px 0 0;
  font-size: 1.75rem;
  font-weight: 600;
}

.orders-insights__description {
  margin: var(--dt-gap-sm) 0 0;
  color: var(--dt-color-text-secondary);
  max-width: 520px;
  font-size: var(--dt-font-size-sm);
}

.orders-insights__totals {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.orders-insights__cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--dt-gap-lg);
  margin-bottom: calc(var(--dt-gap-xl) * 0.8);
}

.orders-insights__card-label {
  margin: 0;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
}

.orders-insights__card-value {
  margin: 8px 0 0;
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--dt-color-text-primary);
}

.orders-insights__card-hint {
  margin: 10px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__visuals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: var(--dt-gap-lg);
  margin-top: calc(var(--dt-gap-xl) * 0.6);
  margin-bottom: calc(var(--dt-gap-xl) * 0.8);
}

.orders-insights__chart {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
  padding: var(--dt-gap-md);
  border-radius: var(--dt-radius-md);
  background: rgba(15, 10, 20, 0.3);
  border: 1px solid rgba(255, 20, 147, 0.15);
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.08);
}

.orders-insights__chart--secondary {
  min-height: 0;
}

.orders-insights__chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--dt-gap-sm);
}

.orders-insights__chart-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.orders-insights__chart-header p {
  margin: 4px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--dt-color-text-primary);
  background: rgba(255, 20, 147, 0.16);
  border: 1px solid rgba(255, 20, 147, 0.35);
}

.orders-insights__chart-body {
  display: flex;
  gap: var(--dt-gap-lg);
  align-items: stretch;
  flex-wrap: wrap;
}

.orders-insights__bars {
  flex: 1 1 260px;
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
}

.orders-insights__bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--dt-gap-sm);
  align-items: center;
}

.orders-insights__bar-meta {
  display: flex;
  align-items: center;
  gap: var(--dt-gap-sm);
}

.orders-insights__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 20, 147, 0.6);
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.6);
}

.orders-insights__bar-label {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-primary);
}

.orders-insights__bar-track {
  grid-column: 1 / -1;
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(11, 18, 35, 0.9);
  overflow: hidden;
  border: 1px solid rgba(255, 20, 147, 0.25);
  box-shadow: inset 0 0 8px rgba(255, 20, 147, 0.2);
}

.orders-insights__bar-fill {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  transition: width 0.3s ease;
  box-shadow: 
    0 0 10px currentColor,
    0 0 20px currentColor;
  animation: shimmer-fill 2s infinite;
}

@keyframes shimmer-fill {
  0% { filter: brightness(1); }
  50% { filter: brightness(1.3); }
  100% { filter: brightness(1); }
}

.orders-insights__bar-value {
  justify-self: end;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__pie {
  flex: 0 1 320px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-left: auto;
  margin-right: auto;
}

.orders-insights__pie-wrap {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 25px rgba(255, 20, 147, 0.3));
}

.orders-insights__pie-canvas {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: rgba(10, 10, 20, 0.6);
  box-shadow: inset 0 2px 15px rgba(255, 20, 147, 0.1);
}

.orders-insights__pie-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.orders-insights__pie-value {
  font-size: 28px;
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

.orders-insights__pie-label {
  font-size: 10px;
  color: rgba(255, 20, 147, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-top: 4px;
}

.orders-insights__pie-chart {
  width: 180px;
  height: 180px;
  transform: rotate(-90deg);
  filter: drop-shadow(0 0 20px rgba(255, 20, 147, 0.5));
  animation: rotate-glow 4s linear infinite;
}

@keyframes rotate-glow {
  0%, 100% { filter: drop-shadow(0 0 20px rgba(255, 20, 147, 0.5)); }
  50% { filter: drop-shadow(0 0 30px rgba(255, 20, 147, 0.7)); }
}

.orders-insights__pie-bg {
  fill: none;
  stroke: rgba(148, 163, 184, 0.2);
  stroke-width: 16;
}

.orders-insights__pie-segment {
  fill: none;
  stroke-width: 16;
  transition: stroke 0.3s ease;
  filter: drop-shadow(0 0 8px currentColor);
  animation: pulse-segment 3s ease-in-out infinite;
}

.orders-insights__pie-segment:hover {
  stroke-width: 18;
  filter: drop-shadow(0 0 15px currentColor);
}

@keyframes pulse-segment {
  0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
  50% { filter: drop-shadow(0 0 12px currentColor); }
}

.orders-insights__legend {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__legend-item {
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

.orders-insights__legend-item:hover {
  border-color: rgba(255, 20, 147, 0.4);
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.15);
  transform: translateX(4px);
}

.orders-insights__legend .orders-insights__dot {
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

.orders-insights__legend-content {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.orders-insights__legend-label {
  flex: 1;
  color: var(--dt-color-text-primary);
  font-weight: 500;
  font-size: 12px;
}

.orders-insights__legend-value {
  color: #FF1493;
  font-weight: 700;
  font-size: 16px;
  text-shadow: 0 0 8px rgba(255, 20, 147, 0.5);
}

.orders-insights__legend-percent {
  font-size: 11px;
  color: var(--dt-color-text-muted);
  font-weight: 600;
  padding: 3px 8px;
  background: rgba(255, 20, 147, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 20, 147, 0.2);
}

.orders-insights__payments {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
}

.orders-insights__payment-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 1fr) auto;
  gap: var(--dt-gap-sm);
  align-items: center;
  padding: 10px 14px;
  border-radius: var(--dt-radius-md);
  background: rgba(15, 10, 20, 0.68);
  border: 1px solid rgba(255, 20, 147, 0.25);
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.08);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.orders-insights__payment-meta {
  display: flex;
  align-items: center;
  gap: var(--dt-gap-sm);
}

.orders-insights__payment-label {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-primary);
}

.orders-insights__payment-track {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(11, 18, 35, 0.9);
  overflow: hidden;
  border: 1px solid rgba(255, 20, 147, 0.2);
  box-shadow: inset 0 0 8px rgba(255, 20, 147, 0.15);
}

.orders-insights__payment-fill {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  transition: width 0.3s ease;
  box-shadow: 
    0 0 8px currentColor,
    0 0 15px currentColor;
  animation: flow-fill 3s ease-in-out infinite;
}

@keyframes flow-fill {
  0%, 100% { filter: brightness(1) saturate(1); }
  50% { filter: brightness(1.4) saturate(1.2); }
}

.orders-insights__payment-value {
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__table {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
  padding: var(--dt-gap-lg);
  border-radius: var(--dt-radius-md);
  background: rgba(15, 10, 20, 0.6);
  border: 1px solid rgba(255, 20, 147, 0.25);
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.15);
  margin-top: calc(var(--dt-gap-xl) * 0.8);
}

.orders-insights__table-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--dt-gap-sm);
}

.orders-insights__table-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.orders-insights__table-header p {
  margin: 4px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__table-scroll {
  width: 100%;
}

.orders-insights__subsection {
  margin-top: var(--dt-gap-lg);
  padding-top: var(--dt-gap-lg);
  border-top: 1px solid rgba(148, 163, 184, 0.12);
  margin-bottom: var(--dt-gap-lg);
}


.orders-insights__chart-header--compact {
  padding-bottom: var(--dt-gap-md);
}
.orders-insights__chart-header--compact h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--dt-color-text-primary);
}

.orders-insights__chart-header--compact p {
  margin: 4px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 860px) {
  .orders-insights__totals {
    align-items: flex-start;
  }
}

@media (max-width: 620px) {
  .orders-insights {
    padding: var(--dt-gap-lg);
  }

  .orders-insights__payment-row {
    grid-template-columns: 1fr;
    gap: var(--dt-gap-xs);
  }
}
</style>
