<template>
  <div class="wrap">
    <h2 class="title">Ordenes</h2>

    <section class="ops-overview">
      <div class="ops-brand">
        <div class="ops-logo">DT</div>
        <div class="ops-text">
          <p class="ops-name">DigitalTex Ops</p>
          <p class="ops-tagline">Monitoreo en tiempo real</p>
          <span class="ops-status">Sistema en línea</span>
        </div>
      </div>
      <div class="ops-metrics">
        <div class="ops-card">
          <span class="ops-card-label">Recaudado hoy</span>
          <strong class="ops-card-value">
            {{ formatArs(resumenPagos.total) }}
          </strong>
        </div>
        <div class="ops-card">
          <span class="ops-card-label">Metros</span>
          <strong class="ops-card-value">
            {{ formatArs(resumenPagos.areaClientes.totalNeto) }}
          </strong>
        </div>
        <div class="ops-card">
          <span class="ops-card-label">Alertas</span>
          <strong
            class="ops-card-value"
            :class="{ 'ops-card-value--warn': alertsCount > 0 }"
          >
            {{ formattedAlerts }}
          </strong>
        </div>
      </div>
    </section>

    <OrdersToolbar
      v-model="q"
      placeholder="Buscar (OT, estado, pago, lugar, metros)"
      @create="openCreator"
    />

    <section class="region">

      <OrdersTable
        :rows="visibleRows"
        :estado-colors="estadoColors"
        :pago-colors="pagoColors"
        @edit="openEditor"
        @load-more="loadMoreRows"
      />
    </section>

    <transition name="modal">
      <OrdersModal
        v-if="editing.open"
        :editing="editing"
        @close="closeEditor"
        @submit="submitForm"
      />
    </transition>

    <OrdersInsights
      :stats="stats"
      :payments-summary="resumenPagos"
      :estado-chart-data="estadoChartData"
      :estado-pie-segments="estadoPieSegments"
      :pago-chart-data="pagoChartData"
      :format-currency="formatArs"
    />
  </div>
</template>

<script setup>
import OrdersInsights from "./orders/OrdersInsights.vue";
import OrdersModal from "./orders/OrdersModal.vue";
import OrdersTable from "./orders/OrdersTable.vue";
import OrdersToolbar from "./orders/OrdersToolbar.vue";
import { useOrdersLive } from "../composables/orders/useOrdersLive.js";

const isBrowser = typeof window !== "undefined";
const isDev = isBrowser && window.location.hostname === "localhost";
const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? (isDev ? "http://localhost:4000" : "");
const baseApi = apiOrigin.replace(/\/$/, "");

// Hook into the composable so the view stays declarative and the networking logic lives in one place.
  const {
    q,
    alertsCount,
    formattedAlerts,
    estadoColors,
    pagoColors,
    resumenPagos,
    visibleRows,
    stats,
    estadoChartData,
    estadoPieSegments,
    pagoChartData,
  editing,
  openEditor,
  openCreator,
  closeEditor,
  submitForm,
  loadMoreRows,
  } = useOrdersLive({
    apiUrl: `${baseApi}/api/os`,
    sseUrl: `${baseApi}/realtime/stream?channel=os`,
    updateUrl: `${baseApi}/api/os/update`,
    createUrl: `${baseApi}/api/os/create`,
    paymentsUrl: `${baseApi}/api/pagos/today`,
    chunkSize: 30,
  });

  const fmtARS = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });
  const formatArs = (value) => fmtARS.format(value ?? 0);
</script>

<style scoped>
.wrap {
  max-width: 1120px;
  width: 100%;
  margin: 0 auto;
  padding: 22px 24px;
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(14, 116, 144, 0.28), rgba(59, 130, 246, 0.14)),
    rgba(10, 16, 40, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow:
    0 24px 60px rgba(14, 165, 233, 0.16),
    inset 0 0 18px rgba(37, 99, 235, 0.2);
  color: #e2e8f0;
  backdrop-filter: blur(10px);
}

.title {
  margin: 0 0 18px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f8fafc;
  text-shadow: 0 0 12px rgba(96, 165, 250, 0.45);
}

.ops-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 18px 20px;
  border-radius: 16px;
  background: rgba(10, 18, 40, 0.78);
  border: 1px solid rgba(94, 234, 212, 0.18);
  box-shadow:
    inset 0 0 14px rgba(59, 130, 246, 0.18),
    0 12px 24px rgba(14, 165, 233, 0.12);
  margin-bottom: 18px;
}

.ops-brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ops-logo {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(236, 72, 153, 0.75));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #f8fafc;
  box-shadow:
    0 12px 24px rgba(59, 130, 246, 0.35),
    inset 0 0 12px rgba(15, 23, 42, 0.8);
}

.ops-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ops-name {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #f8fafc;
}

.ops-tagline {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.78);
}

.ops-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.16);
  color: #4ade80;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 11px;
  border: 1px solid rgba(74, 222, 128, 0.35);
}

.ops-metrics {
  display: flex;
  align-items: stretch;
  gap: 16px;
}

.ops-card {
  padding: 12px 18px;
  border-radius: 14px;
  background: rgba(14, 23, 52, 0.65);
  border: 1px solid rgba(96, 165, 250, 0.18);
  box-shadow: inset 0 0 12px rgba(37, 99, 235, 0.16);
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
}

.ops-card-label {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.7);
}

.ops-card-value {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #f8fafc;
}

.ops-card-value--warn {
  color: #fbbf24;
}

.ops-card-value--inactive {
  color: #94a3b8;
}

.region {
  margin-top: 24px;
  padding: 0;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(14, 165, 233, 0.08)),
    rgba(9, 14, 32, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.25);
  box-shadow:
    0 20px 48px rgba(37, 99, 235, 0.18),
    inset 0 0 18px rgba(14, 165, 233, 0.18);
  display: flex;
  flex-direction: column;
}

.region-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f8fafc;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  padding: 18px 20px 12px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.25);
}

.region-title i {
  font-size: 18px;
}

.region-title h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .wrap {
    padding: 20px 16px;
  }

  .ops-overview {
    flex-direction: column;
    align-items: stretch;
    gap: 18px;
  }

  .ops-metrics {
    flex-direction: column;
  }

  .region {
    padding: 0;
  }

  .region-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 16px;
  }
}
</style>

