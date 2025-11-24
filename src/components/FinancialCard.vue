<template>
  <section class="financial-card dt-card dt-card--glow">
    <header class="financial-card__header">
      <div>
        <h3 class="financial-card__title">Financiero</h3>
      </div>
    </header>

    <div class="financial-card__group">
      <h4 class="financial-card__group-title">Medios de entrada</h4>
      <div class="financial-card__grid">
        <article
          v-for="item in paymentMethodCards"
          :key="item.key"
          class="orders-insights__card dt-card"
        >
          <p class="orders-insights__card-label">{{ item.label }}</p>
          <p class="orders-insights__card-value">{{ formatCurrency(item.amount) }}</p>
          <p class="orders-insights__card-hint">{{ item.hint }}</p>
        </article>
      </div>
    </div>

    <div class="financial-card__group">
      <h4 class="financial-card__group-title">Tipo de movimiento</h4>
      <div class="financial-card__grid">
        <article
          v-for="item in typeCards"
          :key="item.key"
          class="orders-insights__card dt-card"
        >
          <p class="orders-insights__card-label">{{ item.label }}</p>
          <p class="orders-insights__card-value">{{ formatCurrency(item.amount) }}</p>
          <p class="orders-insights__card-hint">{{ item.hint }}</p>
        </article>
      </div>
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
    default: null,
  },
});

const summaryDate = computed(() => props.summary?.date ?? null);

const paymentMethodCards = computed(() => {
  const methods = props.summary?.byPaymentMethod ?? {};
  const details = props.summary?.byPaymentMethodDetails ?? {};
  
  const formatValue = (val) => {
    if (!props.formatCurrency) return `$ ${val.toFixed(2)}`;
    return props.formatCurrency(val);
  };

  return [
    {
      key: "mercado_pago",
      label: "Mercado Pago",
      amount: Number(methods.mercadoPago ?? methods.mp ?? 0),
      hint: `Entraron: ${formatValue(details.mercadoPago?.entradas ?? 0)} y Salieron: ${formatValue(details.mercadoPago?.salidas ?? 0)}`,
    },
    {
      key: "efectivo",
      label: "Efectivo",
      amount: Number(methods.efectivo ?? 0),
      hint: `Entraron: ${formatValue(details.efectivo?.entradas ?? 0)} y Salieron: ${formatValue(details.efectivo?.salidas ?? 0)}`,
    },
    {
      key: "cheque",
      label: "Cheque",
      amount: Number(methods.cheque ?? 0),
      hint: `Entraron: ${formatValue(details.cheque?.entradas ?? 0)} y Salieron: ${formatValue(details.cheque?.salidas ?? 0)}`,
    },
  ];
});

const typeCards = computed(() => {
  const types = props.summary?.byType ?? {};
  
  // Buscar keys case-insensitive
  const findType = (name) => {
    const key = Object.keys(types).find(k => k.toLowerCase() === name.toLowerCase());
    return key ? types[key] : null;
  };
  
  const venta = findType('Venta');
  const adelanto = findType('Adelanto');
  const gasto = findType('Gasto');
  
  return [
    {
      key: "venta",
      label: "Ventas",
      amount: Number(venta?.total ?? 0),
      hint: `${Number(venta?.cantidad ?? 0)} operaciones`,
    },
    {
      key: "adelanto",
      label: "Adelantos",
      amount: Number(adelanto?.total ?? 0),
      hint: `${Number(adelanto?.cantidad ?? 0)} operaciones`,
    },
    {
      key: "gasto",
      label: "Gastos",
      amount: Number(gasto?.total ?? 0),
      hint: `${Number(gasto?.cantidad ?? 0)} operaciones`,
    },
  ];
});

function formatCurrency(value) {
  if (typeof props.formatCurrency === "function") {
    return props.formatCurrency(value);
  }
  const numeric = Number(value ?? 0);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(numeric);
}
</script>

<style scoped>
.financial-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
}

.financial-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dt-gap-md);
}

.financial-card__kicker {
  margin: 0 0 4px;
  font-size: var(--dt-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--dt-color-text-muted);
}

.financial-card__title {
  margin: 0;
  font-size: var(--dt-font-size-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dt-color-text-primary);
}

.financial-card__date {
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
}

.financial-card__group {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
}

.financial-card__group-title {
  margin: 0;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
}

.financial-card__grid {
  display: grid;
  gap: var(--dt-gap-sm);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.orders-insights__card {
  background: rgba(10, 18, 38, 0.68);
  border-radius: var(--dt-radius-md);
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.orders-insights__card-label {
  margin: 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.orders-insights__card-value {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 600;
  color: var(--dt-color-text-primary);
}

.orders-insights__card-hint {
  margin: 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

@media (max-width: 960px) {
  .financial-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .financial-card__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
