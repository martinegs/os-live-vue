<template>
  <section class="insights">
    <header class="insights-header">
      <h4>Resumen en vivo</h4>
      <span>
        {{ (stats.totalOrdenes ?? 0) }} órdenes -
        {{ currency(stats.totalFacturado) }} facturado
      </span>
    </header>

    <div class="insights-grid">
      <div class="insight-card">
        <span class="insight-label">Pagado (hoy)</span>
        <strong class="insight-value">{{ currency(paymentsSummary?.aggregate?.totalNeto ?? 0) }}</strong>
        <span class="insight-sub">Recaudado hoy (tabla pagos)</span>
      </div>
      <div class="insight-card">
        <span class="insight-label">Ticket promedio (hoy)</span>
        <strong class="insight-value">{{ todaysTicket }}</strong>
        <span class="insight-sub">Promedio por orden hoy</span>
      </div>
      <div class="insight-card">
        <span class="insight-label">Metros (hoy)</span>
        <strong class="insight-value">{{ props.resumenHoy?.metros ?? 0 }}</strong>
        <span class="insight-sub">{{ todaysOrdersWithMeters }} órdenes con metros</span>
      </div>
    </div>





    <div class="charts-wrapper">
      <div class="insight-chart">
        <header class="insight-chart__header">
          <h5>Distribución por estado (HOY)</h5>
          <span>{{ (statsToday?.estadoTotal ?? stats.estadoTotal ?? 0) }} estados activos</span>
        </header>
        <div class="chart-layout">
      <div class="bars">
            <div
              v-for="item in estadoChartData"
              :key="item.label"
              class="bar"
              :style="{ '--bar-width': item.porcentaje + '%', '--bar-color': item.color }"
            >
              <span class="bar-label">{{ item.label }}</span>
              <span class="bar-value">{{ item.cantidad }} ({{ item.porcentaje.toFixed(0) }}%)</span>
              <span class="bar-fill"></span>
            </div>
            <svg viewBox="0 0 120 120" class="pie-chart">
              <circle class="pie-bg" cx="60" cy="60" r="42" />
              <circle
                v-for="segment in estadoPieSegments"
                :key="segment.label"
                class="pie-segment"
                cx="60"
                cy="60"
                r="42"
                :stroke="segment.color"
                :stroke-dasharray="segment.dashArray"
                :stroke-dashoffset="segment.dashOffset"
              />
            </svg>
            <ul class="pie-legend">
              <li v-for="segment in estadoPieSegments" :key="segment.label">
                <span class="dot" :style="{ '--dot-color': segment.color }"></span>
                <span class="legend-label">{{ segment.label }}</span>
                <span class="legend-value">{{ segment.cantidad }}</span>
              </li>
            </ul>

          </div>
        </div>
      </div>

      <div v-if="pagoChartData.length" class="insight-chart insight-chart--secondary">
        <header class="insight-chart__header">
          <h5>Pagos registrados (HOY)</h5>
          <span>{{ (statsToday?.totalOrdenes ?? stats.totalOrdenes ?? 0) }} órdenes consideradas</span>
        </header>
        <div class="payment-list">
          <div
            v-for="item in pagoChartData"
            :key="item.label"
            class="payment-row"
          >
            <div class="payment-meta">
              <span class="payment-dot" :style="{ '--dot-color': item.color }"></span>
              <span class="payment-label">{{ item.label }}</span>
            </div>
            <div class="payment-bar">
              <span class="payment-bar__fill" :style="{ width: item.porcentaje.toFixed(0) + '%', background: item.color }"></span>
            </div>
            <span class="payment-value">
              {{ item.cantidad }} ({{ item.porcentaje.toFixed(0) }}%)
            </span>
          </div>
        </div>
      </div>
    </div>
      <div style="margin-top: 32px;">
        <KpiLugares :rows="rows" class="kpi-lugares-full" />
      </div>
      <div style="margin-top: 18px;">
        <div class="insight-chart">
          <header class="insight-chart__header">
            <h5>Recaudación (pagos) - totales diarios</h5>
            <span>Hace 3 • Hace 2 • Ayer • Hoy • Proy. Mañana</span>
            <div style="margin-left:12px;color:rgba(148,163,184,0.85);font-size:13px;">Proyección mañana: {{ currency(projectedTomorrow) }}</div>
          </header>
          <div class="table-scroll">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Hace 3</th>
                  <th>Hace 2</th>
                  <th>Ayer</th>
                  <th>Hoy</th>
                  <th>Proy. Mañana</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="col-branch">Total neto recibido</td>
                  <td>{{ currency(payTotals[0]) }}</td>
                  <td>{{ currency(payTotals[1]) }}</td>
                  <td>{{ currency(payTotals[2]) }}</td>
                  <td>{{ currency(payTotals[3]) }}</td>
                  <td>{{ currency(projectedTomorrow) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
  </section>
</template>

<script setup>
import KpiLugares from '../KpiLugares.vue';
import { computed, ref, onMounted } from 'vue';
// Small formatting helper keeps the template tidy while relying on the formatter passed from the parent.
const props = defineProps({
  stats: {
    type: Object,
    required: true,
  },
  statsToday: {
    type: Object,
    required: false,
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
  paymentsSummary: {
    type: Object,
    required: false,
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
  resumenHoy: {
    type: Object,
    required: false,
    default: () => ({ total: 0, metros: 0 }),
  },
});

function currency(value) {
  return props.formatCurrency(value ?? 0);
}

// Computed helpers for today's metrics based on the provided rows
const todaysRows = computed(() => {
  const hoy = new Date().toISOString().slice(0, 10);
  return (props.rows || []).filter((row) => {
    const fecha = row.fechaIngreso ?? row.ts ?? null;
    if (!fecha) return false;
    const d = new Date(fecha);
    if (Number.isNaN(d.getTime())) return false;
    return d.toISOString().slice(0, 10) === hoy;
  });
});

const todaysOrdersWithMeters = computed(() =>
  todaysRows.value.filter((r) => {
    const m = Number(r.metros ?? 0);
    return Number.isFinite(m) && m > 0;
  }).length
);

const todaysTicket = computed(() => {
  const rows = todaysRows.value;
  if (!rows.length) return currency(0);
  const totalFacturado = rows.reduce((s, r) => s + (Number(r.valorTotal ?? 0) || 0), 0);
  return currency(totalFacturado / rows.length);
});

// Fetch totals desde /api/pagos/today?date=YYYY-MM-DD para los 4 días y calcular proyección
const payTotals = ref([0,0,0,0,0]);

function formatLocalDate(d) {
  const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
  const localMidnight = new Date(d.getTime() - tzOffsetMs);
  return localMidnight.toISOString().slice(0, 10);
}

async function fetchPayTotalForDate(dateStr) {
  try {
    const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? (isDev ? 'http://localhost:4000' : '');
    const baseApi = String(apiOrigin || '').replace(/\/$/, '');
    const url = `${baseApi}/api/pagos/today?date=${encodeURIComponent(dateStr)}`;
    console.info('[OrdersInsights] fetching pagos', { url, dateStr });
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) {
      let txt = '';
      try { txt = await res.text(); } catch (e) { txt = String(e); }
      console.warn('[OrdersInsights] fallo fetch pagos', { dateStr, status: res.status, body: txt });
      return 0;
    }
    const body = await res.json();
    console.info('[OrdersInsights] pagos response', { dateStr, body });
    // body.aggregate.totalNeto o body.mpOrders.totalValorPagado
    if (body && body.aggregate && typeof body.aggregate.totalNeto === 'number') return body.aggregate.totalNeto;
    if (body && body.mpOrders && typeof body.mpOrders.totalValorPagado === 'number') return body.mpOrders.totalValorPagado;
    return 0;
  } catch (err) {
    console.warn('[OrdersInsights] error fetch pagos', err);
    return 0;
  }
}

onMounted(async () => {
  const now = new Date();
  const dates = [3,2,1,0].map((offset) => formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)));
  const results = await Promise.all(dates.map(d => fetchPayTotalForDate(d)));
  for (let i = 0; i < 4; i++) payTotals.value[i] = results[i] || 0;
  const hoy = payTotals.value[3] || 0;
  const ayer = payTotals.value[2] || 0;
  const delta = hoy - ayer;
  payTotals.value[4] = Math.max(0, Math.round(hoy + delta));
});

const projectedTomorrow = computed(() => {
  const d3 = Number(payTotals.value[0] || 0);
  const d2 = Number(payTotals.value[1] || 0);
  const ayer = Number(payTotals.value[2] || 0);
  const hoy = Number(payTotals.value[3] || 0);

  // Caso ideal: hoy y ayer presentes
  if (hoy > 0 && ayer >= 0) {
    const delta = hoy - ayer;
    const proj = hoy + delta;
    return Math.max(0, Math.round(proj * 100) / 100);
  }

  // Si solo hoy tiene valor, usar hoy como base
  if (hoy > 0 && ayer === 0) {
    return Math.round(hoy * 100) / 100;
  }

  // Si solo ayer tiene valor, usar ayer como base
  if (ayer > 0 && hoy === 0) {
    return Math.round(ayer * 100) / 100;
  }

  // Usar promedio de últimos no-cero (d3, d2, ayer, hoy)
  const vals = [d3, d2, ayer, hoy].filter(v => v > 0);
  if (vals.length) {
    const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
    return Math.round(avg * 100) / 100;
  }

  // Fallback final: 0
  return 0;
});
</script>

<style scoped>
.insights {
  margin-top: 28px;
  padding: 22px 24px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(14, 165, 233, 0.05)),
    rgba(10, 16, 40, 0.75);
  border: 1px solid rgba(56, 189, 248, 0.25);
  box-shadow:
    0 18px 40px rgba(14, 165, 233, 0.12),
    inset 0 0 12px rgba(37, 99, 235, 0.15);
  color: #e2e8f0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-sizing: border-box;
}

.kpi-lugares-full {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.insights-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 18px;
}

.insights-header h4 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f8fafc;
}

.insights-header span {
  font-size: 13px;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.75);
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-bottom: 22px;
  align-items: stretch;
}

.insight-card {
  border-radius: 14px;
  padding: 16px 18px;
  background: rgba(10, 12, 34, 0.65);
  border: 1px solid rgba(94, 234, 212, 0.15);
  box-shadow: inset 0 0 14px rgba(15, 118, 110, 0.18);
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.insight-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: rgba(148, 163, 184, 0.75);
}

.insight-value {
  font-size: 20px;
  font-weight: 600;
  color: #f8fafc;
}

.insight-sub {
  font-size: 12px;
  color: rgba(148, 163, 184, 0.75);
}

.insight-chart {
  margin-top: 10px;
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(9, 12, 26, 0.65);
}

.insight-chart__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: rgba(226, 232, 240, 0.8);
}

.insight-chart__header h5 {
  margin: 0;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.chart-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}

.bars {
  flex: 1 1 320px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar {
  position: relative;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(96, 165, 250, 0.18);
  overflow: hidden;
}

.bar-fill {
  position: absolute;
  inset: 0;
  width: var(--bar-width);
  background: linear-gradient(90deg, var(--bar-color), transparent);
  opacity: 0.35;
  pointer-events: none;
}

.bar-label,
.bar-value {
  position: relative;
  z-index: 1;
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.bar-value {
  float: right;
  color: rgba(226, 232, 240, 0.85);
}

.pie {
  flex: 0 1 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pie-chart {
  width: 160px;
  height: 160px;
  transform: rotate(-90deg);
}

.pie-bg {
  fill: none;
  stroke: rgba(148, 163, 184, 0.2);
  stroke-width: 16;
}

.pie-segment {
  fill: none;
  stroke-width: 16;
  transition: stroke 0.3s ease;
}

.pie-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pie-legend li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.75);
}

.pie-legend .dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
  background: var(--dot-color, #38bdf8);
  box-shadow: 0 0 8px var(--dot-color, #38bdf8);
}

.pie-legend .legend-label {
  flex: 1 1 auto;
  margin-left: 4px;
}

.pie-legend .legend-value {
  font-weight: 600;
  color: #e2e8f0;
  margin-left: 12px;
}

@media (max-width: 720px) {
  .insights-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .chart-layout {
    flex-direction: column;
    align-items: stretch;
  }

  .pie {
    align-items: flex-start;
  }
}
.charts-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 18px;
}

.insight-chart--secondary {
  min-height: 0;
}

.table-scroll {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table thead th {
  text-align: left;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.85);
}

.data-table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
}

.data-table tbody tr:hover {
  background: rgba(30, 41, 59, 0.35);
}

.col-branch {
  font-weight: 600;
}

.payment-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.25);
}

.payment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.payment-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dot-color, #22c55e);
  box-shadow: 0 0 6px var(--dot-color, #22c55e);
}

.payment-label {
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(226, 232, 240, 0.82);
}

.payment-bar {
  position: relative;
  height: 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  overflow: hidden;
}

.payment-bar__fill {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.payment-value {
  font-size: 12px;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.75);
}

@media (max-width: 720px) {
  .payment-row {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .payment-value {
    text-align: right;
  }
}
</style>



