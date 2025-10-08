<template>
  <div ref="container" class="tablewrap region-content">
    <table class="table table-bordered responsive-table">
      <thead>
        <tr class="text-center">
          <th scope="col">#</th>
          <th scope="col">Cliente</th>
              <th scope="col">Usuario</th>
              <th scope="col">Metros</th>
              <th scope="col">Clase</th>
              <th scope="col">Lugar de Entrega</th>
          <th scope="col">Status Orden</th>
          <th scope="col">Status Pago</th>
        </tr>
      </thead>
      <tbody class="align-middle">
        <tr v-if="rows.length === 0">
          <td colspan="10" class="text-center">No se han encontrado datos</td>
        </tr>
        <tr
          v-for="row in rows"
          :key="row.id"
          :class="rowClasses(row)"
          @click="emit('edit', row)"
        >
          <td data-label="#">
            {{ row.id }}
            <span v-if="Number(row.es_rehacer) === 1" class="badge rehacer">R</span>
          </td>
          <td data-label="Cliente">
            {{ row.cliente_nombre || "Sin cliente" }}
            <span v-if="Number(row.usuario_id) === 14" class="emoji">VIP</span>
          </td>
          <td data-label="Usuario">{{ row.usuario_nombre || row.nome || "-" }}</td>
          <td data-label="Metros">{{ formatNumber(row.metros) }}</td>
          <td data-label="Clase">{{ row.clase || "?" }}</td>
          <td data-label="Lugar de Entrega">{{ formatPlace(row.lugarEntrega || row.lugar || "?") }}</td>
          <td data-label="Status Orden" class="text-center status-col">
            <span class="status-chip" :style="badgeStyle(row.status, estadoColors)">
              {{ row.status || "?" }}
            </span>
          </td>
          <td data-label="Status Pago" class="text-center status-col status-col--pago">
            <span
              class="status-chip"
              :class="{ 'status-chip--mp': row.esAreaClientes && row.hayNOP && showMp(row.status) }"
              :style="badgeStyle(row.statusPago, pagoColors, row.esAreaClientes && row.hayNOP && showMp(row.status))"
            >
              {{ formatPagoLabel(row.statusPago, row.esAreaClientes && row.hayNOP && showMp(row.status)) }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  estadoColors: {
    type: Object,
    default: () => ({}),
  },
  pagoColors: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["edit", "load-more"]);

const container = ref(null);
let lastEmittedHeight = 0;

// Emit a "load-more" event when the user approaches the end of the scrollable table.
const handleScroll = () => {
  const el = container.value;
  if (!el) return;
  const { scrollTop, scrollHeight, clientHeight } = el;
  const atBottom = scrollTop + clientHeight >= scrollHeight - 80;
  if (atBottom && scrollHeight !== lastEmittedHeight) {
    lastEmittedHeight = scrollHeight;
    emit("load-more");
  } else if (!atBottom && scrollTop + clientHeight < scrollHeight - 160) {
    lastEmittedHeight = 0;
  }
};

onMounted(() => {
  if (container.value) {
    container.value.addEventListener("scroll", handleScroll, { passive: true });
  }
});

onBeforeUnmount(() => {
  if (container.value) {
    container.value.removeEventListener("scroll", handleScroll);
  }
});

// Orders paid through Mercado Pago should only highlight when the status still allows it.
const mpDisabledStatuses = new Set(["presupuesto", "cancelado"]);

function formatNumber(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "?";
  if (num === 0) return "0";
  if (Math.abs(num) >= 1) {
    return num.toLocaleString("es-AR", {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }
  return num.toFixed(2);
}

function badgeStyle(status, palette, isMp) {
  const key = (status || "").trim();
  const color = palette[key] || palette._fallback || "#475569";
  if (isMp) {
    return {
      backgroundColor: "#00aae4",
      borderColor: "#008dc7",
      color: "#f8fafc",
    };
  }
  return {
    backgroundColor: color,
    borderColor: color,
    color: "#0f172a",
  };
}

function showMp(status) {
  return !mpDisabledStatuses.has((status || "").toLowerCase());
}

function formatPagoLabel(label, isMp) {
  if (isMp) return "Pagado";
  return label || "?";
}

function rowClasses(row) {
  return {
    blink: row._blinkUntil && row._blinkUntil > Date.now(),
    "row-pending": Number(row.pendiente) === 1,
  };
}

function formatPlace(value) {
  if (!value) return "?";
  return value.replace(/^local\s*-\s*/i, "").trim() || "?";
}
</script>

<style scoped>
.tablewrap {
  overflow-x: auto;
  overflow-y: auto;
  width: 100%;
  height: auto;
  max-height: 1260px;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 16px;
  background: rgba(6, 11, 25, 0.92);
  box-shadow:
    0 16px 40px rgba(14, 165, 233, 0.18),
    inset 0 0 16px rgba(30, 64, 175, 0.16);
  flex: 1 1 auto;
  min-height: 0;
}

.tablewrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.tablewrap::-webkit-scrollbar-thumb {
  background: rgba(96, 165, 250, 0.4);
  border-radius: 999px;
}

.tablewrap::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.6);
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  color: #e2e8f0;
}

thead th {
  position: sticky;
  top: 0;
  background: linear-gradient(90deg, rgba(30, 64, 175, 0.55), rgba(59, 130, 246, 0.35));
  padding: 12px 14px;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 12px;
  color: #cbd5f5;
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  box-shadow: inset 0 -1px 0 rgba(96, 165, 250, 0.45);
}

tbody tr:nth-child(odd) td {
  background: rgba(15, 23, 42, 0.82);
}

tbody tr:nth-child(even) td {
  background: rgba(12, 20, 38, 0.75);
}

tbody tr:hover td {
  background: rgba(59, 130, 246, 0.22);
  box-shadow: inset 0 0 16px rgba(96, 165, 250, 0.25);
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(30, 64, 175, 0.25);
  transition: background 0.18s ease;
}

td[data-label="#"] {
  font-weight: 600;
  letter-spacing: 0.08em;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #0f172a;
  background: rgba(148, 163, 184, 0.2);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.18);
  min-width: 140px;
}

.status-col {
  padding: 6px 10px;
}

.status-col .status-chip {
  width: auto;
}

.status-col--pago .status-chip {
  margin-right: 6px;
}

.mp-chip {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.25);
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #38bdf8;
  font-size: 10px;
  letter-spacing: 0.2em;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 999px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}

.badge.rehacer {
  margin-left: 6px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.6);
  color: #f87171;
  font-size: 10px;
}

.row-pending td {
  background: rgba(239, 68, 68, 0.1) !important;
  box-shadow: inset 0 0 18px rgba(239, 68, 68, 0.2);
}

.blink,
tr.blink td {
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.35), rgba(236, 72, 153, 0.35)) !important;
  box-shadow:
    inset 0 0 18px rgba(236, 72, 153, 0.55),
    0 0 14px rgba(236, 72, 153, 0.3);
  animation: pulseRow 1.1s ease-in-out infinite alternate;
}

.emoji {
  margin-left: 6px;
  font-size: 11px;
  letter-spacing: 0.18em;
  color: #facc15;
}

.responsive-table {
  min-width: 980px;
}

@keyframes pulseRow {
  0% {
    opacity: 0.92;
    filter: drop-shadow(0 0 6px rgba(236, 72, 153, 0.45));
  }
  100% {
    opacity: 1;
    filter: drop-shadow(0 0 18px rgba(236, 72, 153, 0.8));
  }
}

@media (max-width: 1024px) {
  .tablewrap {
    max-height: none;
  }

  .responsive-table {
    min-width: unset;
  }

  .responsive-table thead {
    display: none;
  }

  .responsive-table tbody {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .responsive-table tr {
    display: block;
    border: 1px solid rgba(96, 165, 250, 0.28);
    background: rgba(10, 18, 40, 0.85);
    box-shadow: inset 0 0 12px rgba(37, 99, 235, 0.15);
    padding: 12px 0;
  }

  .responsive-table td {
    display: block;
    border: none;
    border-bottom: 1px solid rgba(37, 99, 235, 0.2);
    padding: 12px 16px 12px 128px;
    position: relative;
    white-space: normal;
  }

  .responsive-table td:last-child {
    border-bottom: none;
  }

  .responsive-table td::before {
    content: attr(data-label);
    position: absolute;
    left: 16px;
    top: 12px;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(148, 163, 184, 0.75);
  }
}

@media (max-width: 640px) {
  .responsive-table td {
    padding: 10px 14px 10px 112px;
  }

  .responsive-table td::before {
    left: 14px;
    top: 10px;
  }
}
</style>
