<template>
  <div class="orders-live">
    <section class="orders-live__hero dt-surface dt-surface--elevated">
      <div>
        <p class="dt-kicker">Operaciones</p>
        <h1 class="orders-live__title">Ordenes en vivo</h1>
        <p class="orders-live__subtitle">
          Monitor en tiempo real de ordenes, pagos y recaudacion diaria.
        </p>
      </div>
      <div class="orders-live__session">
        <span class="orders-live__status">
          <span
            class="orders-live__status-dot"
            :class="authenticated ? 'orders-live__status-dot--online' : 'orders-live__status-dot--offline'"
          ></span>
          {{ authenticated ? "Sesion activa" : "Sesion requerida" }}
        </span>
        <button
          v-if="authenticated"
          type="button"
          class="orders-live__session-btn orders-live__session-btn--logout"
          @click="handleLogout"
        >
          Cerrar sesion
        </button>
        <button v-else type="button" class="orders-live__session-btn" @click="openLogin">
          Iniciar sesion
        </button>
      </div>
    </section>

    <section class="orders-live__metrics">
      <article class="orders-live__metric dt-card dt-card--glow">
        <p class="orders-live__metric-label">Recaudado hoy</p>
        <p class="orders-live__metric-value">{{ formatCurrency(paymentsSummaryTotal) }}</p>
        <p class="orders-live__metric-hint">Pagos confirmados</p>
      </article>
      <article class="orders-live__metric dt-card">
        <p class="orders-live__metric-label">Metros hoy</p>
        <p class="orders-live__metric-value">{{ formatNumber(metersToday) }}</p>
        <p class="orders-live__metric-hint">Produccion registrada</p>
      </article>
      <article class="orders-live__metric dt-card">
        <p class="orders-live__metric-label">Alertas</p>
        <p
          class="orders-live__metric-value"
          :class="alertsCount > 0 ? 'orders-live__metric-value--warn' : undefined"
        >
          {{ formattedAlerts }}
        </p>
        <p class="orders-live__metric-hint">Ultimos 15 minutos</p>
      </article>
    </section>

    <section class="orders-live__board dt-surface">
      <div class="orders-live__toolbar">
        <OrdersToolbar
          v-model="q"
          placeholder="Busca por OT, estado, pago, lugar o metros"
          @create="openCreator"
        />
      </div>
      <div class="orders-live__table">
        <OrdersTable
          :rows="visibleRows"
          :estado-colors="estadoColors"
          :pago-colors="pagoColors"
          @edit="openEditor"
          @load-more="loadMoreRows"
        />
      </div>
    </section>

    <OrdersInsights
      class="orders-live__insights"
      :stats="stats"
      :stats-today="statsToday"
      :payments-summary="resumenPagos"
      :estado-chart-data="estadoChartDataToday"
      :estado-pie-segments="estadoPieSegmentsToday"
      :pago-chart-data="pagoChartDataToday"
      :format-currency="formatCurrency"
      :rows="visibleRows"
      :resumen-hoy="resumenHoy"
    />

    <transition name="modal">
      <OrdersModal v-if="editing.open" :editing="editing" @close="closeEditor" @submit="submitForm" />
    </transition>

    <transition name="modal">
      <LoginModal v-if="showLogin" @success="onLoginSuccess" @close="onLoginClose" />
    </transition>

    <div v-if="!authenticated" class="orders-live__overlay">
      <div class="orders-live__overlay-card">
        <h3>Sesion requerida</h3>
        <p>Inicia sesion para continuar monitoreando las operaciones.</p>
        <button type="button" class="orders-live__overlay-btn" @click="openLogin">
          Iniciar sesion
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import OrdersToolbar from "./orders/OrdersToolbar.vue";
import OrdersTable from "./orders/OrdersTable.vue";
import OrdersModal from "./orders/OrdersModal.vue";
import OrdersInsights from "./orders/OrdersInsights.vue";
import LoginModal from "./LoginModal.vue";
import { useOrdersLive } from "../composables/orders/useOrdersLive.js";
import { getSessionRemainingMs, isAuthenticated, logout } from "../services/authService";

const isBrowser = typeof window !== "undefined";
const isDev = isBrowser && window.location.hostname === "localhost";
const apiOrigin = import.meta.env.VITE_API_ORIGIN ?? (isDev ? "http://localhost:4000" : "");
const baseApi = apiOrigin.replace(/\/$/, "");

const {
  q,
  alertsCount,
  formattedAlerts,
  estadoColors,
  pagoColors,
  resumenPagos,
  resumenHoy,
  visibleRows,
  stats,
  statsToday,
  estadoChartDataToday,
  estadoPieSegmentsToday,
  pagoChartDataToday,
  editing,
  openEditor,
  openCreator,
  closeEditor,
  submitForm,
  loadMoreRows,
} = useOrdersLive({
  apiUrl: `${baseApi}/api/os`,
  sseUrl: `${baseApi}/realtime/stream?channel=os`,
  paymentsUrl: `${baseApi}/api/pagos/today`,
  chunkSize: 30,
});

const showLogin = ref(false);
const authenticated = ref(isAuthenticated());
let logoutTimer = null;

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  return currencyFormatter.format(value ?? 0);
}

function formatNumber(value) {
  return numberFormatter.format(value ?? 0);
}

const paymentsSummaryTotal = computed(() => resumenPagos.value?.aggregate?.totalNeto ?? 0);
const metersToday = computed(() => resumenHoy.value?.metros ?? 0);

function scheduleAutoLogout() {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
    logoutTimer = null;
  }
  const remaining = getSessionRemainingMs();
  if (remaining > 0) {
    logoutTimer = setTimeout(() => {
      logout();
      authenticated.value = false;
      openLogin();
    }, remaining);
  } else {
    logout();
    authenticated.value = false;
    openLogin();
  }
}

function onLoginSuccess() {
  showLogin.value = false;
  authenticated.value = true;
  scheduleAutoLogout();
}

function onLoginClose() {
  showLogin.value = false;
}

function openLogin() {
  showLogin.value = true;
}

function handleLogout() {
  logout();
  authenticated.value = false;
  openLogin();
}

onMounted(() => {
  if (!isAuthenticated()) {
    authenticated.value = false;
    openLogin();
  } else {
    authenticated.value = true;
    scheduleAutoLogout();
  }
});

onBeforeUnmount(() => {
  if (logoutTimer) {
    clearTimeout(logoutTimer);
  }
});

defineExpose({ openLogin });
</script>

<style scoped>
.orders-live {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-xl);
}

.orders-live__hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--dt-gap-lg);
  padding: var(--dt-gap-lg) var(--dt-gap-xl);
}

.orders-live__title {
  margin: 2px 0 0;
  font-size: 2rem;
  font-weight: 600;
  color: var(--dt-color-text-primary);
  letter-spacing: -0.01em;
}

.orders-live__subtitle {
  margin: var(--dt-gap-sm) 0 0;
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-secondary);
  max-width: 420px;
}

.orders-live__session {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--dt-gap-sm);
}

.orders-live__status {
  display: inline-flex;
  align-items: center;
  gap: var(--dt-gap-xs);
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-live__status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(72, 85, 106, 0.8);
  box-shadow: 0 0 6px rgba(72, 85, 106, 0.6);
}

.orders-live__status-dot--online {
  background: var(--dt-color-success);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.6);
}

.orders-live__status-dot--offline {
  background: var(--dt-color-warning);
  box-shadow: 0 0 8px rgba(251, 191, 36, 0.6);
}

.orders-live__session-btn {
  padding: 10px 18px;
  border-radius: var(--dt-radius-md);
  border: 1px solid rgba(99, 102, 241, 0.35);
  background: rgba(99, 102, 241, 0.14);
  color: var(--dt-color-text-primary);
  font-size: var(--dt-font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.orders-live__session-btn:hover {
  border-color: rgba(99, 102, 241, 0.6);
  transform: translateY(-1px);
}

.orders-live__session-btn--logout {
  border-color: rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.12);
}

.orders-live__metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--dt-gap-lg);
}

.orders-live__metric {
  position: relative;
  overflow: hidden;
}

.orders-live__metric-label {
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
  margin: 0;
}

.orders-live__metric-value {
  margin: 6px 0 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--dt-color-text-primary);
  letter-spacing: -0.01em;
}

.orders-live__metric-value--warn {
  color: var(--dt-color-warning);
}

.orders-live__metric-hint {
  margin: 8px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-secondary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.orders-live__board {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
  padding: var(--dt-gap-lg);
  border-radius: var(--dt-radius-lg);
}

.orders-live__toolbar {
  display: flex;
  align-items: center;
  gap: var(--dt-gap-md);
  justify-content: flex-start;
  flex-wrap: wrap;
}

.orders-live__table {
  border-radius: var(--dt-radius-md);
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(11, 18, 35, 0.8);
}

.orders-live__insights {
  display: block;
}

.orders-live__overlay {
  position: absolute;
  inset: 0;
  background: rgba(5, 8, 22, 0.88);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.orders-live__overlay-card {
  padding: var(--dt-gap-xl);
  border-radius: var(--dt-radius-lg);
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: rgba(11, 18, 35, 0.92);
  text-align: center;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
  color: var(--dt-color-text-primary);
}

.orders-live__overlay-card h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.orders-live__overlay-card p {
  margin: 0;
  color: var(--dt-color-text-secondary);
}

.orders-live__overlay-btn {
  margin-top: var(--dt-gap-md);
  border-radius: var(--dt-radius-md);
  border: 1px solid var(--dt-color-accent);
  background: var(--dt-color-accent);
  color: #0f172a;
  font-weight: 600;
  padding: 10px 18px;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .orders-live__hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .orders-live__session {
    align-items: flex-start;
  }

  .orders-live__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .orders-live__metrics {
    grid-template-columns: minmax(0, 1fr);
  }

  .orders-live__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .orders-live__new-btn {
    width: 100%;
  }
}
</style>
