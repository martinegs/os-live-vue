<template>
  <section class="orders-insights dt-surface dt-surface--elevated">
    <header class="orders-insights__header">
      <div>
        <p class="dt-kicker">Insights de ordenes</p>
        <h2 class="orders-insights__title">Resumen en vivo</h2>
        <p class="orders-insights__description">
          Datos consolidados de produccion, recaudacion y desempeno diario.
        </p>
      </div>
      <div class="orders-insights__totals">
        <span>{{ ordersTotal }} ordenes</span>
        <span>{{ currency(totalFacturado) }} facturado</span>
      </div>
    </header>

    <div class="orders-insights__visuals">
      <section class="orders-insights__chart">
        <header class="orders-insights__chart-header">
          <div>
            <h3>Distribucion por estado</h3>
            <p>Detalle de ordenes activas hoy</p>
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
            <svg viewBox="0 0 120 120" class="orders-insights__pie-chart">
              <circle class="orders-insights__pie-bg" cx="60" cy="60" r="42" />
              <circle
                v-for="segment in estadoPieSegments"
                :key="segment.label"
                class="orders-insights__pie-segment"
                cx="60"
                cy="60"
                r="42"
                :stroke="segment.color"
                :stroke-dasharray="segment.dashArray"
                :stroke-dashoffset="segment.dashOffset"
              />
            </svg>
            <ul class="orders-insights__legend">
              <li v-for="segment in estadoPieSegments" :key="segment.label">
                <span class="orders-insights__dot" :style="{ background: segment.color }"></span>
                <span class="orders-insights__legend-label">{{ segment.label }}</span>
                <span class="orders-insights__legend-value">{{ segment.cantidad }}</span>
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
      </section>
    </div>
    <KpiLugares :rows="rows" class="orders-insights__kpi" />

    <section class="orders-insights__table dt-surface">
      <header class="orders-insights__table-header">
        <div>
          <h3>Recaudacion diaria</h3>
          <p>Comparativo de los ultimos dias y proyeccion</p>
        </div>
        <span class="orders-insights__tag">Proyeccion: {{ currency(projectedTomorrow) }}</span>
      </header>
      <div class="orders-insights__table-scroll dt-scroll">
        <table class="dt-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Hace 3</th>
              <th>Hace 2</th>
              <th>Ayer</th>
              <th>Hoy</th>
              <th>Proy. manana</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total neto recibido</td>
              <td>{{ currency(payTotals[0]) }}</td>
              <td>{{ currency(payTotals[1]) }}</td>
              <td>{{ currency(payTotals[2]) }}</td>
              <td>{{ currency(payTotals[3]) }}</td>
              <td>{{ currency(projectedTomorrow) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";

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
  resumenHoy: {
    type: Object,
    default: () => ({ total: 0, metros: 0 }),
  },
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
  const today = new Date().toISOString().slice(0, 10);
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
  const now = new Date();
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
  const values = {
    d3: Number(d3 ?? 0),
    d2: Number(d2 ?? 0),
    ayer: Number(ayer ?? 0),
    hoy: Number(hoy ?? 0),
  };

  if (values.hoy > 0 && values.ayer > 0) {
    const delta = values.hoy - values.ayer;
    return Math.max(0, Math.round((values.hoy + delta) * 100) / 100);
  }

  if (values.hoy > 0 && values.ayer <= 0) {
    return Math.round(values.hoy * 100) / 100;
  }

  if (values.ayer > 0 && values.hoy <= 0) {
    return Math.round(values.ayer * 100) / 100;
  }

  const recent = [values.d3, values.d2, values.ayer, values.hoy].filter((value) => value > 0);
  if (recent.length) {
    const average = recent.reduce((sum, value) => sum + value, 0) / recent.length;
    return Math.round(average * 100) / 100;
  }

  return 0;
}

const projectedTomorrow = computed(() =>
  calculateProjection({
    d3: payTotals.value[0],
    d2: payTotals.value[1],
    ayer: payTotals.value[2],
    hoy: payTotals.value[3],
  }),
);
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
  padding: var(--dt-gap-lg);
  border-radius: var(--dt-radius-md);
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.18);
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
  background: rgba(99, 102, 241, 0.16);
  border: 1px solid rgba(99, 102, 241, 0.32);
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
  background: rgba(99, 102, 241, 0.6);
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.6);
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
}

.orders-insights__bar-fill {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.orders-insights__bar-value {
  justify-self: end;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__pie {
  flex: 0 1 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--dt-gap-sm);
}

.orders-insights__pie-chart {
  width: 180px;
  height: 180px;
  transform: rotate(-90deg);
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
}

.orders-insights__legend {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__legend li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dt-gap-sm);
}

.orders-insights__legend-label {
  flex: 1;
  color: var(--dt-color-text-secondary);
}

.orders-insights__legend-value {
  color: var(--dt-color-text-primary);
  font-weight: 600;
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
  background: rgba(11, 18, 35, 0.68);
  border: 1px solid rgba(148, 163, 184, 0.16);
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
}

.orders-insights__payment-fill {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  transition: width 0.3s ease;
}

.orders-insights__payment-value {
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-insights__kpi {
  width: 100%;
  margin-top: calc(var(--dt-gap-xl) * 0.6);
  margin-bottom: calc(var(--dt-gap-xl) * 0.8);
}

.orders-insights__table {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
  padding: var(--dt-gap-lg);
  border-radius: var(--dt-radius-md);
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.18);
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
