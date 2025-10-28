<template>
  <section class="financial-card dt-card">
    <header class="financial-card__header">
      <div>
        <p class="financial-card__kicker">Ingresos</p>
        <h3 class="financial-card__title">Financiero</h3>
        <p v-if="summaryDate" class="financial-card__meta">Corte {{ summaryDate }}</p>
      </div>
      <span class="financial-card__badge" v-if="totalNeto > 0">
        {{ formatCurrency(totalNeto) }}
      </span>
    </header>

    <div class="financial-card__totals">
      <article class="financial-card__stat">
        <p class="financial-card__stat-label">Recaudado</p>
        <p class="financial-card__stat-value">
          {{ formatCurrency(totalNeto) }}
        </p>
      </article>
      <article class="financial-card__stat">
        <p class="financial-card__stat-label">Operaciones</p>
        <p class="financial-card__stat-value financial-card__stat-value--muted">
          {{ operaciones }}
        </p>
      </article>
      <article class="financial-card__stat">
        <p class="financial-card__stat-label">Ticket promedio</p>
        <p class="financial-card__stat-value financial-card__stat-value--muted">
          {{ formatCurrency(ticketPromedio) }}
        </p>
      </article>
    </div>

    <div v-if="hasItems" class="financial-card__list">
      <h4 class="financial-card__list-title">Origen de ingresos</h4>
      <ul>
        <li v-for="item in topItems" :key="item.key" class="financial-card__list-item">
          <div>
            <span class="financial-card__item-name">{{ item.origen }}</span>
            <span class="financial-card__item-subtitle">{{ item.operaciones }} operaciones</span>
          </div>
          <span class="financial-card__item-amount">
            {{ formatCurrency(item.totalNeto ?? item.totalBruto ?? 0) }}
          </span>
        </li>
      </ul>
    </div>
    <div v-else class="financial-card__empty">
      <p>Sin movimientos registrados para hoy.</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  summary: {
    type: Object,
    default: () => null,
  },
  formatCurrency: {
    type: Function,
    required: true,
  },
});

const formatCurrency = (value) => {
  if (typeof props.formatCurrency === "function") {
    return props.formatCurrency(value);
  }
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(numeric);
};
const aggregate = computed(() => props.summary?.aggregate ?? {});
const items = computed(() => props.summary?.items ?? []);

const totalNeto = computed(() => Number(aggregate.value.totalNeto ?? 0));
const operaciones = computed(() => Number(aggregate.value.operaciones ?? 0));
const ticketPromedio = computed(() => {
  if (!operaciones.value) return 0;
  return totalNeto.value / operaciones.value;
});

const summaryDate = computed(() => props.summary?.date ?? null);
const hasItems = computed(() => items.value.length > 0);
const topItems = computed(() => items.value.slice(0, 3));
</script>

<style scoped>
.financial-card {
  gap: var(--dt-gap-md);
  min-height: 280px;
  background: rgba(12, 18, 38, 0.72);
  border: 1px solid rgba(99, 102, 241, 0.24);
  box-shadow: inset 0 1px 0 rgba(226, 232, 240, 0.12);
}

.financial-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--dt-gap-md);
}

.financial-card__kicker {
  margin: 0 0 4px;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
}

.financial-card__title {
  margin: 0;
  font-size: var(--dt-font-size-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dt-color-text-primary);
}

.financial-card__meta {
  margin: 6px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.financial-card__badge {
  align-self: flex-start;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dt-color-accent);
  border: 1px solid rgba(99, 102, 241, 0.45);
  background: rgba(99, 102, 241, 0.14);
}

.financial-card__totals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--dt-gap-md);
}

.financial-card__stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.financial-card__stat-label {
  margin: 0;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
}

.financial-card__stat-value {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 600;
  color: var(--dt-color-text-primary);
}

.financial-card__stat-value--muted {
  font-size: 1.25rem;
}

.financial-card__list {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
}

.financial-card__list-title {
  margin: 0;
  font-size: var(--dt-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--dt-color-text-muted);
}

.financial-card__list ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.financial-card__list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dt-gap-sm);
  padding: 10px 12px;
  border-radius: var(--dt-radius-sm);
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(8, 16, 34, 0.64);
}

.financial-card__item-name {
  display: block;
  font-size: var(--dt-font-size-sm);
  font-weight: 500;
  color: var(--dt-color-text-primary);
}

.financial-card__item-subtitle {
  display: block;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.financial-card__item-amount {
  font-size: var(--dt-font-size-sm);
  font-weight: 600;
  color: var(--dt-color-accent);
}

.financial-card__empty {
  padding: 42px 0;
  text-align: center;
  color: var(--dt-color-text-muted);
  font-size: var(--dt-font-size-sm);
}

@media (max-width: 960px) {
  .financial-card__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
