<template>
  <div class="branch-bars">
    <h4 class="title">Recaudación por sucursal (Últimos días)</h4>
    <div class="charts-grid">
      <div v-for="(label, idx) in dayLabels" :key="label" class="chart-card">
        <div class="chart-header">
          <span class="chart-label">{{ label }}</span>
        </div>
        <svg viewBox="0 0 420 220" width="100%" height="200" class="chart-svg" role="img" :aria-label="`Bar chart ${label}`" preserveAspectRatio="xMidYMid meet">
          <g v-for="(b, i) in branches" :key="b.name">
            <rect
              :x="getBarX(i)"
              :y="getBarY(idx, i)"
              :width="barW"
              :height="getBarHeight(idx, i)"
              :fill="colorForIndex(i)"
              rx="6"
            />
            <text v-if="getBarHeight(idx,i) > 3" :x="getBarX(i) + barW/2" :y="getBarY(idx,i) - 6" text-anchor="middle" class="value-text">{{ formatCurrency(Number(b.amounts?.[idx] || 0)) }}</text>
          </g>
          <!-- X labels (branch short names) -->
          <g class="x-labels">
            <text v-for="(b, i) in branches" :key="b.name + '-lbl'" :x="getBarX(i) + barW/2" :y="190" text-anchor="middle" class="x-text">{{ shortName(b.name) }}</text>
          </g>
        </svg>
      </div>
    </div>

    <div class="legend global-legend" v-if="branches.length">
      <small v-for="(b, i) in branches" :key="b.name" class="legend-item">
        <span class="dot" :style="{ background: colorForIndex(i) }"></span>
        <span class="name">{{ b.name }}</span>
      </small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

// Props: expect array of branches with amounts per day
// data format: [{ name: 'Sucursal A', amounts: [a3, a2, a1, today, projTomorrow] }, ...]
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
  // Optional labels override for the five days
  labels: {
    type: Array,
    default: () => ['Hace 3', 'Hace 2', 'Ayer', 'Hoy', 'Proy. Mañana'],
  },
});

const branches = computed(() => {
  if (props.data && props.data.length) return props.data;
  // sample placeholder data
  return [
    { name: 'Sucursal Centro', amounts: [12000, 14500, 16000, 17500, 19000] },
    { name: 'Sucursal Norte', amounts: [8000, 9000, 9500, 11000, 12000] },
    { name: 'Sucursal Sur', amounts: [4000, 6000, 7000, 6800, 7500] },
    { name: 'Sucursal Este', amounts: [3000, 4200, 3800, 4600, 5200] },
  ];
});

const dayLabels = computed(() => props.labels.slice(0,5));

// SVG layout
const svgWidth = 420;
const svgHeight = 220;
const gap = 12;
const barW = 28;
const chartInnerW = svgWidth - 24; // padding

const formatCurrency = (v) => {
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(v || 0);
  } catch (e) { return String(v); }
};

const isAllZero = (dayIdx) => {
  return branches.value.every(b => Number(b.amounts?.[dayIdx] || 0) === 0);
};

// compute max across relevant day to scale bars per chart (per day)
const maxForDay = (dayIdx) => {
  const arr = branches.value.map(b => Number(b.amounts?.[dayIdx] || 0));
  return Math.max(1, ...arr);
};

const getBarX = (index) => {
  // distribute bars evenly
  const totalBars = branches.value.length;
  const spacing = totalBars > 1 ? (chartInnerW - (totalBars * barW)) / (totalBars - 1) : 0;
  const x0 = 12; // left padding
  return x0 + index * (barW + spacing);
};

const getBarHeight = (dayIdx, index) => {
  const val = Number(branches.value[index].amounts?.[dayIdx] || 0);
  const max = maxForDay(dayIdx);
  const maxH = svgHeight - 36; // leave space for labels
  const h = Math.round((val / max) * maxH);
  // ensure minimal visual height so día sin datos no se ve vacío
  return Math.max(h, val > 0 ? 3 : (max === 1 ? 2 : 0));
};

const getBarY = (dayIdx, index) => {
  const h = getBarHeight(dayIdx, index);
  // bars grow upwards from bottom (leave bottom 20px for branch labels)
  return svgHeight - 20 - h;
};

const colorForIndex = (i) => {
  const palette = ['#06b6d4','#7c3aed','#06d6a0','#f59e0b','#ef4444','#3b82f6'];
  return palette[i % palette.length];
};

const shortName = (name) => {
  if (!name) return '';
  if (name.length <= 10) return name;
  return name.split(' ').map(w => w[0]).join('');
};
</script>

<style scoped>
.branch-bars {
  margin-top: 18px;
  padding: 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(10,16,40,0.72), rgba(8,12,28,0.9));
  border: 1px solid rgba(94,234,212,0.06);
}
.title { margin: 6px 0 12px; color: #e6eef8; font-weight:700 }
.charts-grid { display:flex; gap:12px; flex-wrap:wrap }
.chart-card { background: rgba(6,9,25,0.6); border-radius:10px; padding:10px; width: calc(20% - 10px); box-sizing:border-box; min-width:180px; display:flex; flex-direction:column; align-items:stretch; min-height:260px }
.chart-header { display:flex; justify-content:center; margin-bottom:6px }
.chart-label { color:#cbd5e1; font-weight:600 }
.chart-svg { background: linear-gradient(180deg, rgba(255,255,255,0.01), transparent); border-radius:8px; display:block; flex:1 }
.x-text { fill: rgba(226,232,240,0.7); font-size:11px }
.value-text { fill: rgba(226,232,240,0.92); font-size:11px; font-weight:700 }
.no-data { text-align:center; color:rgba(148,163,184,0.8); margin-top:8px }
.legend { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; justify-content:center }
.global-legend { margin-top:12px; display:flex; justify-content:center; gap:12px }
.legend-item { display:flex; gap:8px; align-items:center; color:#cbd5e1; font-size:12px }
.dot { width:10px; height:10px; border-radius:2px; display:inline-block }
.name { max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap }

@media (max-width: 900px) {
  .chart-card { width: 48%; }
}
@media (max-width: 520px) {
  .chart-card { width: 100%; }
}
</style>
