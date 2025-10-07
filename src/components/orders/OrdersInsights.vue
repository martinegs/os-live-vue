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
        <span class="insight-label">Pagado</span>
        <strong class="insight-value">{{ currency(stats.totalPagado) }}</strong>
        <span class="insight-sub">Saldo pendiente: {{ currency(stats.totalPendiente) }}</span>
      </div>
      <div class="insight-card">
        <span class="insight-label">Ticket promedio</span>
        <strong class="insight-value">{{ currency(stats.ticketPromedio) }}</strong>
        <span class="insight-sub">{{ currency(stats.promedioPagado) }} abonado promedio</span>
      </div>
      <div class="insight-card">
        <span class="insight-label">Metros en proceso</span>
        <strong class="insight-value">{{ stats.totalMetros ?? 0 }}</strong>
        <span class="insight-sub">{{ stats.ordenesConMetros ?? 0 }} órdenes con metros</span>
      </div>
    </div>

    <div class="insight-chart">
      <header class="insight-chart__header">
        <h5>Distribución por estado</h5>
        <span>{{ stats.estadoTotal ?? 0 }} estados activos</span>
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
        </div>

        <div class="pie">
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
  </section>
</template>

<script setup>
const props = defineProps({
  stats: {
    type: Object,
    required: true,
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
  formatCurrency: {
    type: Function,
    default: (value) => value,
  },
});

function currency(value) {
  return props.formatCurrency(value ?? 0);
}
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



