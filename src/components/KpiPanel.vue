<template>
  <section class="kpi-panel">
    <h3 class="kpi-title">Indicadores Clave</h3>
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Órdenes de hoy</span>
        <strong class="kpi-value">{{ resumenHoy.ordenes ?? 0 }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Metros impresos hoy</span>
        <strong class="kpi-value">{{ resumenHoy.metros ?? 0 }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Recaudado hoy</span>
        <strong class="kpi-value">{{ formatArs(resumenHoy.total ?? 0) }}</strong>
      </div>
      <div class="kpi-card">
        <span class="kpi-label">Alertas</span>
        <strong class="kpi-value" :class="{ 'kpi-value--warn': alertsCount > 0 }">{{ formattedAlerts }}</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
const props = defineProps({
  resumenHoy: { type: Object, required: true },
  alertsCount: { type: Number, default: 0 },
  formattedAlerts: { type: String, default: '00' },
  formatArs: { type: Function, required: true }
});
</script>

<style scoped>
.kpi-panel {
  background: rgba(10, 18, 40, 0.78);
  border-radius: 16px;
  padding: 18px 20px;
  margin-bottom: 18px;
  box-shadow: 0 8px 24px rgba(14, 165, 233, 0.10);
}
.kpi-title {
  margin: 0 0 12px;
  font-size: 20px;
  color: #f8fafc;
  letter-spacing: 0.12em;
}
.kpi-grid {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}
.kpi-card {
  background: rgba(14, 23, 52, 0.65);
  border-radius: 12px;
  padding: 14px 18px;
  min-width: 140px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: inset 0 0 8px rgba(37, 99, 235, 0.10);
}
.kpi-label {
  font-size: 12px;
  color: #a3a3a3;
  letter-spacing: 0.10em;
  text-transform: uppercase;
}
.kpi-value {
  font-size: 20px;
  font-weight: 600;
  color: #f8fafc;
}
.kpi-value--warn {
  color: #fbbf24;
}
</style>
