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
        <div class="orders-live__date-selector">
          <label>Fecha:</label>
          <input 
            type="date" 
            v-model="selectedDate"
            @change="updateSimulatedDate"
            class="orders-live__date-input"
          />
        </div>
      </div>
    </section>

    <section class="orders-live__metrics">
      <article class="orders-live__metric dt-card dt-card--glow">
        <p class="orders-live__metric-label">Recaudado hoy</p>
        <p class="orders-live__metric-value">{{ formatCurrency(paymentsSummaryTotal) }}</p>
        <p class="orders-live__metric-hint">Pagos confirmados</p>
      </article>
      <article class="orders-live__metric dt-card dt-card--glow">
        <p class="orders-live__metric-label">Metros hoy</p>
        <p class="orders-live__metric-value">{{ formatNumber(metersToday) }}</p>
        <p class="orders-live__metric-hint">Produccion registrada</p>
      </article>
      <article class="orders-live__metric dt-card dt-card--glow">
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
      <KpiLugares 
        class="orders-live__board-kpi" 
        :rows="todaysRowsForCharts"
        :selected-date="selectedDate"
      />
    </section>

    <section class="orders-live__summary-cards">
      <AttendanceCard class="orders-live__summary-card" :api-origin="apiOrigin" />
      <FinancialCard
        class="orders-live__summary-card"
        :summary="resumenPagos"
        :format-currency="formatCurrency"
      />
    </section>

    <OrdersInsights
      class="orders-live__insights"
      :stats="stats"
      :stats-today="statsToday"
      :payments-summary="resumenPagos"
      :estado-chart-data="estadoChartDataToday"
      :estado-pie-segments="estadoPieSegmentsToday"
      :pago-chart-data="pagoChartDataToday"
      :clase-chart-data="claseChartDataToday"
      :format-currency="formatCurrency"
      :rows="visibleRows"
      :selected-date="selectedDate"
      :resumen-hoy="resumenHoy"
    />

    <!-- Estadísticas Financieras y Operativas -->
    <StatsDashboard 
      class="orders-live__stats"
      :api-origin="apiOrigin"
      :selected-date="selectedDate"
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
import AttendanceCard from "./AttendanceCard.vue";
import FinancialCard from "./FinancialCard.vue";
import KpiLugares from "./KpiLugares.vue";
import LoginModal from "./LoginModal.vue";
import StatsDashboard from "./StatsDashboard.vue";
import { useOrdersLive } from "../composables/orders/useOrdersLive.js";
import { getSessionRemainingMs, isAuthenticated, logout } from "../services/authService";
import { setSimulatedDate, clearSimulatedDate, getSimulatedDate, useDateTime } from "../composables/useDateTime";

const { getCurrentDate } = useDateTime();

// Inicializar con la fecha simulada si existe, o fecha de hoy
const storedDate = getSimulatedDate();
const selectedDate = ref(
  storedDate 
    ? storedDate.slice(0, 10) 
    : getCurrentDate().toISOString().slice(0, 10)
);

function updateSimulatedDate() {
  if (selectedDate.value) {
    const today = getCurrentDate().toISOString().slice(0, 10);
    if (selectedDate.value === today) {
      clearSimulatedDate();
    } else {
      setSimulatedDate(`${selectedDate.value}T10:00:00`);
    }
    window.location.reload();
  }
}

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
  todaysRowsForCharts,
  stats,
  statsToday,
  estadoChartDataToday,
  estadoPieSegmentsToday,
  pagoChartDataToday,
  claseChartDataToday,
  editing,
  openEditor,
  openCreator,
  closeEditor,
  submitForm,
  loadMoreRows,
} = useOrdersLive({
  apiUrl: `${baseApi}/api/os`,
  sseUrl: `${baseApi}/realtime/stream?channel=os`,
  paymentsUrl: `${baseApi}/api/lancamentos/summary`,
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

const paymentsSummaryTotal = computed(
  () => resumenPagos.value?.totalNeto ?? 0
);
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
  border: 1px solid rgba(255, 20, 147, 0.35);
  background: rgba(255, 20, 147, 0.14);
  color: var(--dt-color-text-primary);
  font-size: var(--dt-font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.15);
}

.orders-live__session-btn:hover {
  border-color: rgba(255, 20, 147, 0.6);
  transform: translateY(-1px);
  box-shadow: 0 0 15px rgba(255, 20, 147, 0.3);
}

.orders-live__session-btn--logout {
  border-color: rgba(255, 20, 147, 0.5);
  background: rgba(255, 20, 147, 0.2);
  box-shadow: 0 0 12px rgba(255, 20, 147, 0.2);
}

.orders-live__session-btn--logout:hover {
  border-color: rgba(255, 20, 147, 0.7);
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
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

.orders-live__board-kpi {
  width: 100%;
}

.orders-live__summary-cards {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-gap-lg);
  margin-top: var(--dt-gap-lg);
}

.orders-live__summary-card {
  flex: 1 1 320px;
  min-width: 320px;
}

@media (max-width: 960px) {
  .orders-live__summary-card {
    min-width: 0;
    flex-basis: 100%;
  }
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

.orders-live__date-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.orders-live__date-selector label {
  font-size: 0.875rem;
  color: var(--dt-color-text-secondary);
  font-weight: 500;
}

.orders-live__date-input {
  padding: 8px 12px;
  border-radius: var(--dt-radius-sm);
  border: 1px solid var(--dt-color-border);
  background: var(--dt-color-surface);
  color: var(--dt-color-text);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.orders-live__date-input:focus {
  outline: none;
  border-color: var(--dt-color-accent);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.orders-live__date-input:hover {
  border-color: var(--dt-color-accent);
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
