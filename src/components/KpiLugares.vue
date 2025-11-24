<template>
  <div class="insight-card kpi-lugares-card kpi-lugares-big dt-card dt-card--glow">
    <div class="kpi-header">
      <div>
        <span class="insight-label">Órdenes por Sucursal</span>
        <p class="insight-subtitle">Distribución geográfica {{ dateLabel }}</p>
      </div>
      <span class="insight-badge">{{ totalCount }} total</span>
    </div>

    <div class="kpi-body">
      <div class="chart-wrap">
        <canvas ref="chartRef" class="chart-canvas" aria-hidden="true"></canvas>
        <div class="chart-center">
          <div class="center-value">{{ totalCount }}</div>
          <div class="center-sub">ordenes</div>
        </div>
      </div>

      <ul class="kpi-legend">
        <li class="kpi-legend-item">
          <span class="dot mendoza" aria-hidden="true"></span>
          <div class="legend-content">
            <span class="legend-label">Mendoza</span>
            <span class="legend-value">{{ mendozaCount }}</span>
            <span class="legend-percent">{{ getMendozaPercent() }}%</span>
          </div>
        </li>
        <li class="kpi-legend-item">
          <span class="dot capital" aria-hidden="true"></span>
          <div class="legend-content">
            <span class="legend-label">Capital Federal</span>
            <span class="legend-value">{{ capitalCount }}</span>
            <span class="legend-percent">{{ getCapitalPercent() }}%</span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';

const props = defineProps({
  rows: { type: Array, required: true },
  selectedDate: { type: String, default: '' }
});

const dateLabel = computed(() => {
  if (!props.selectedDate) return 'hoy';
  const date = new Date(props.selectedDate + 'T12:00:00');
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  if (isToday) return 'hoy';
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
});

const mendozaCount = computed(() =>
  props.rows.filter(row => row.lugares_id === 'LM').length
);
const capitalCount = computed(() =>
  props.rows.filter(row => row.lugares_id === 'LC').length
);

const chartRef = ref(null);
const totalCount = computed(() => mendozaCount.value + capitalCount.value);

function getMendozaPercent() {
  if (totalCount.value === 0) return 0;
  return Math.round((mendozaCount.value / totalCount.value) * 100);
}

function getCapitalPercent() {
  if (totalCount.value === 0) return 0;
  return Math.round((capitalCount.value / totalCount.value) * 100);
}

function getData() {
  return {
    labels: ['Mendoza', 'Capital Federal'],
    data: [mendozaCount.value, capitalCount.value]
  };
}



function getCssColor(varName) {
  try {
    // accept 'var(--name)' or '--name'
    let name = varName;
    const varMatch = /var\s*\(\s*(--[a-zA-Z0-9-_]+)\s*\)/.exec(varName);
    if (varMatch) name = varMatch[1];
    if (name.startsWith('--')) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name);
      // if variable missing, return null so caller can fallback to defaults
      return v ? v.trim() : null;
    }
    return varName;
  } catch (e) {
    return varName;
  }
}


onMounted(() => {
  renderChart();
  window.addEventListener('resize', renderChart);
});

watch([mendozaCount, capitalCount], () => {
  renderChart();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderChart);
});
function renderChart() {
  const canvas = chartRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // responsive sizing
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(160, rect.width * dpr);
  canvas.height = Math.max(120, rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const { data } = getData();
  const total = data.reduce((a, b) => a + b, 0) || 1;
  let startAngle = -0.5 * Math.PI; // start at top
  const baseColors = ['#FF1493', '#00FFFF']; // Rosa neón y Cyan
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(cx, cy) - 8;
  const innerRadius = radius * 0.62;

  // Si no hay datos, no dibujar
  if (total === 0 || radius <= 0) {
    return;
  }

  // draw each segment with a radial gradient + subtle stroke
  data.forEach((value, i) => {
    const angle = (value / total) * 2 * Math.PI;
    const color = baseColors[i % baseColors.length];

  // use flat color (same as legend) for visual consistency
  const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, innerRadius * 0.3, cx, cy, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, color);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
    ctx.closePath();

    // shadow/glow
  ctx.save();
  ctx.shadowColor = hexToRgba(color, 0.6);
  ctx.shadowBlur = 20;
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // thin inner stroke to separate segments
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = hexToRgba('#0b1020', 0.65);
    ctx.stroke();

    startAngle += angle;
  });

  // draw inner hole to create donut
  ctx.beginPath();
  ctx.fillStyle = getCssColor('var(--card-bg)') || '#0b1020';
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

function lighten(hex, amount = 0.1) {
  try {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    let r = (num >> 16) + Math.round(255 * amount);
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * amount);
    let b = (num & 0x0000FF) + Math.round(255 * amount);
    r = Math.min(255, r);
    g = Math.min(255, g);
    b = Math.min(255, b);
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
  } catch (e) {
    return hex;
  }
}

</script>

<style scoped>
.kpi-lugares-card {
  padding: var(--dt-gap-md);
  background: transparent !important;
  border: 1px solid rgba(255, 20, 147, 0.15) !important;
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.08) !important;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.insight-label {
  font-size: var(--dt-font-size-lg);
  font-weight: 600;
  color: var(--dt-color-text-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 10px rgba(255, 20, 147, 0.4);
}

.insight-subtitle {
  margin: 4px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.insight-badge {
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

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.chart-wrap {
  position: relative;
  width: 100%;
  max-width: 520px;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: drop-shadow(0 0 25px rgba(255, 20, 147, 0.3));
}

.chart-canvas {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: rgba(10, 10, 20, 0.6);
  box-shadow: inset 0 2px 15px rgba(255, 20, 147, 0.1);
}

.chart-center {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.center-value {
  font-size: 32px;
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

.center-sub {
  font-size: 11px;
  color: rgba(255, 20, 147, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  margin-top: 4px;
}

.kpi-legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 420px;
}

.kpi-legend-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: rgba(15, 10, 20, 0.5);
  border-radius: var(--dt-radius-md);
  border: 1px solid rgba(255, 20, 147, 0.2);
  box-shadow: 0 0 10px rgba(255, 20, 147, 0.08);
  transition: all 0.3s ease;
}

.kpi-legend-item:hover {
  border-color: rgba(255, 20, 147, 0.4);
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.15);
  transform: translateX(4px);
}

.kpi-legend .dot {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  animation: pulse-dot 2s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.kpi-legend .dot.mendoza {
  background: #FF1493;
  box-shadow: 
    0 0 12px rgba(255, 20, 147, 0.6),
    0 0 25px rgba(255, 20, 147, 0.3);
}

.kpi-legend .dot.capital {
  background: #00FFFF;
  box-shadow: 
    0 0 12px rgba(0, 255, 255, 0.6),
    0 0 25px rgba(0, 255, 255, 0.3);
}

.legend-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.legend-label {
  font-size: 13px;
  color: var(--dt-color-text-primary);
  font-weight: 500;
  flex: 1;
}

.legend-value {
  font-weight: 700;
  color: #FF1493;
  font-size: 18px;
  text-shadow: 0 0 8px rgba(255, 20, 147, 0.5);
}

.legend-percent {
  font-size: 12px;
  color: var(--dt-color-text-muted);
  font-weight: 600;
  padding: 4px 8px;
  background: rgba(255, 20, 147, 0.1);
  border-radius: 4px;
  border: 1px solid rgba(255, 20, 147, 0.2);
}

@media (max-width: 720px) {
  .chart-wrap { height: 150px; }
  .center-value { font-size: 24px; }
  .kpi-legend { gap: 12px; }
  .kpi-header { flex-direction: column; gap: 12px; }
}
</style>
