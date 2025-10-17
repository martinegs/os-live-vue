<template>
  <div class="insight-card kpi-lugares-card kpi-lugares-big">
    <div class="kpi-header">
      <span class="insight-label">Órdenes por Sucursal</span>
    </div>

    <div class="kpi-body">
      <div class="chart-wrap">
        <canvas ref="chartRef" class="chart-canvas" aria-hidden="true"></canvas>
        <div class="chart-center">
          <div class="center-value">{{ totalCount }}</div>
          <div class="center-sub">hoy</div>
        </div>
      </div>

      <ul class="kpi-legend">
        <li class="kpi-legend-item">
          <span class="dot mendoza" aria-hidden="true"></span>
          <span class="legend-label">Mendoza</span>
          <span class="legend-value">{{ mendozaCount }}</span>
        </li>
        <li class="kpi-legend-item">
          <span class="dot capital" aria-hidden="true"></span>
          <span class="legend-label">Capital Federal</span>
          <span class="legend-value">{{ capitalCount }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
const props = defineProps({
  rows: { type: Array, required: true }
});

function isToday(fecha) {
  if (!fecha) return false;
  const hoy = new Date();
  const fechaObj = new Date(fecha);
  return fechaObj.getFullYear() === hoy.getFullYear() &&
    fechaObj.getMonth() === hoy.getMonth() &&
    fechaObj.getDate() === hoy.getDate();
}

const mendozaCount = computed(() =>
  props.rows.filter(row => row.lugares_id === 'LM' && isToday(row.fechaIngreso || row.ts)).length
);
const capitalCount = computed(() =>
  props.rows.filter(row => row.lugares_id === 'LC' && isToday(row.fechaIngreso || row.ts)).length
);

const chartRef = ref(null);
const totalCount = computed(() => mendozaCount.value + capitalCount.value);

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
  const baseColors = [getCssColor('var(--mendoza)') || '#38bdf8', getCssColor('var(--capital)') || '#fbbf24'];
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const radius = Math.min(cx, cy) - 8;
  const innerRadius = radius * 0.62;

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
  ctx.shadowColor = hexToRgba(color, 0.14);
  ctx.shadowBlur = 8;
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
  background: linear-gradient(135deg, rgba(56,189,248,0.06), rgba(251,191,36,0.03));
  border: 1px solid rgba(148,163,184,0.06);
  padding: 20px;
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.chart-wrap {
  position: relative;
  width: 100%;
  max-width: 520px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-canvas {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: var(--card-bg);
  box-shadow: inset 0 2px 10px rgba(2,6,23,0.6);
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
  font-size: 22px;
  font-weight: 700;
  color: #e2e8f0;
}

.center-sub {
  font-size: 12px;
  color: rgba(226,232,240,0.6);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.kpi-legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 24px;
  align-items: center;
}

.kpi-legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #e2e8f0;
}

.kpi-legend .dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid rgba(11,16,32,0.6);
}

.kpi-legend .dot.mendoza {
  background: #38bdf8;
  box-shadow: 0 6px 12px rgba(56,189,248,0.12);
  border-color: rgba(11,16,32,0.5);
}

.kpi-legend .dot.capital {
  background: #fbbf24;
  box-shadow: 0 6px 12px rgba(251,191,36,0.12);
  border-color: rgba(11,16,32,0.5);
}

.kpi-legend-item { gap: 12px; }

.legend-label {
  font-size: 13px;
  color: rgba(226,232,240,0.85);
}

.legend-value {
  font-weight: 700;
  color: #ffffff;
  margin-left: 6px;
}

@media (max-width: 720px) {
  .chart-wrap { height: 120px; }
  .center-value { font-size: 18px; }
}
</style>
