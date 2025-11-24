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
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 4px;
  background: rgba(10, 10, 10, 0.95);
  backdrop-filter: blur(10px) brightness(0.8);
  box-shadow:
    0 0 30px rgba(255, 20, 147, 0.2),
    0 0 60px rgba(255, 20, 147, 0.1),
    0 20px 50px rgba(0, 0, 0, 0.8),
    inset 0 0 30px rgba(0, 0, 0, 0.7);
  flex: 1 1 auto;
  min-height: 0;
  position: relative;
}

.tablewrap::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -100%;
  width: 200%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 20, 147, 0.6) 30%,
    rgba(0, 255, 255, 0.6) 50%,
    rgba(255, 20, 147, 0.6) 70%,
    transparent
  );
  animation: border-scan 4s linear infinite;
}

.tablewrap::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, 
    transparent,
    rgba(255, 20, 147, 0.4) 50%,
    transparent
  );
  opacity: 0.5;
}

@keyframes border-scan {
  0%, 100% {
    left: -100%;
    opacity: 0.5;
  }
  10%, 90% {
    opacity: 1;
  }
  50% {
    left: 100%;
  }
}

.tablewrap::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.tablewrap::-webkit-scrollbar-track {
  background: rgba(255, 20, 147, 0.04);
  border-radius: 0;
}

.tablewrap::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(255, 20, 147, 0.5), rgba(0, 255, 255, 0.5));
  border-radius: 0;
  border: 1px solid rgba(255, 20, 147, 0.25);
  box-shadow: 0 0 12px rgba(255, 20, 147, 0.3);
}

.tablewrap::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(255, 20, 147, 0.7), rgba(0, 255, 255, 0.7));
  box-shadow: 0 0 20px rgba(255, 20, 147, 0.5);
}

.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  color: #e0e7ff;
  font-family: 'Inter', 'Rajdhani', monospace, sans-serif;
}

thead th {
  position: sticky;
  top: 0;
  background: linear-gradient(90deg, rgba(255, 20, 147, 0.15), rgba(10, 10, 10, 0.95));
  backdrop-filter: blur(15px) brightness(0.8);
  padding: 12px 14px;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 10px;
  font-weight: 700;
  color: #FF1493;
  text-shadow: 
    0 0 10px rgba(255, 20, 147, 0.6),
    0 0 20px rgba(255, 20, 147, 0.3);
  border-bottom: 2px solid rgba(255, 20, 147, 0.4);
  box-shadow: 
    inset 0 -2px 0 rgba(255, 20, 147, 0.25),
    0 5px 15px rgba(255, 20, 147, 0.15);
  z-index: 10;
}

tbody tr:nth-child(odd) td {
  background: rgba(10, 10, 10, 0.7);
}

tbody tr:nth-child(even) td {
  background: rgba(5, 5, 5, 0.6);
}

tbody tr:hover td {
  background: rgba(255, 20, 147, 0.1);
  box-shadow: 
    inset 0 0 25px rgba(255, 20, 147, 0.12),
    inset 0 0 5px rgba(255, 20, 147, 0.3),
    0 0 15px rgba(255, 20, 147, 0.2);
  cursor: pointer;
  border-color: rgba(255, 20, 147, 0.3);
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 20, 147, 0.12);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

td[data-label="#"] {
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #FF1493;
  text-shadow: 
    0 0 6px rgba(255, 20, 147, 0.5),
    0 0 12px rgba(255, 20, 147, 0.25);
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
  font-weight: 600;
  color: #0a0a0f;
  background: rgba(160, 174, 192, 0.25);
  border: 1px solid rgba(255, 20, 147, 0.4);
  box-shadow: 
    0 0 15px rgba(255, 20, 147, 0.25),
    inset 0 0 10px rgba(255, 20, 147, 0.1);
  min-width: 140px;
  transition: all 0.3s ease;
}

.status-chip:hover {
  box-shadow: 
    0 0 20px rgba(255, 20, 147, 0.4),
    inset 0 0 15px rgba(255, 20, 147, 0.15);
  transform: scale(1.02);
  border-color: rgba(255, 20, 147, 0.6);
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
  border-radius: 2px;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.25), rgba(255, 20, 147, 0.25));
  border: 1px solid rgba(0, 255, 255, 0.5);
  color: #00FFFF;
  text-shadow: 
    0 0 8px rgba(0, 255, 255, 0.6),
    0 0 15px rgba(0, 255, 255, 0.3);
  font-size: 9px;
  letter-spacing: 0.25em;
  font-weight: 700;
  box-shadow: 
    0 0 12px rgba(0, 255, 255, 0.3),
    inset 0 0 8px rgba(0, 255, 255, 0.08);
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 2px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.18em;
}

.badge.rehacer {
  margin-left: 6px;
  background: linear-gradient(135deg, rgba(255, 69, 0, 0.4), rgba(255, 0, 0, 0.4));
  border: 1px solid rgba(255, 69, 0, 0.8);
  color: #FF4500;
  text-shadow: 
    0 0 10px rgba(255, 69, 0, 1),
    0 0 20px rgba(255, 69, 0, 0.5);
  font-size: 9px;
  box-shadow: 
    0 0 15px rgba(255, 69, 0, 0.5),
    inset 0 0 10px rgba(255, 69, 0, 0.2);
  animation: pulse-badge 1.5s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    box-shadow: 
      0 0 15px rgba(255, 69, 0, 0.5),
      inset 0 0 10px rgba(255, 69, 0, 0.2);
  }
  50% {
    box-shadow: 
      0 0 30px rgba(255, 69, 0, 0.8),
      0 0 50px rgba(255, 69, 0, 0.4),
      inset 0 0 15px rgba(255, 69, 0, 0.3);
  }
}

.row-pending td {
  background: rgba(255, 69, 0, 0.15) !important;
  box-shadow: 
    inset 0 0 25px rgba(255, 69, 0, 0.2),
    inset 0 0 5px rgba(255, 69, 0, 0.5);
  border-left: 3px solid rgba(255, 69, 0, 0.8);
}

.blink,
tr.blink td {
  background: linear-gradient(90deg, rgba(255, 20, 147, 0.25), rgba(0, 255, 255, 0.25)) !important;
  box-shadow:
    inset 0 0 25px rgba(255, 20, 147, 0.3),
    0 0 20px rgba(255, 20, 147, 0.2);
  animation: pulseRow 1s ease-in-out infinite alternate;
  border-left: 3px solid rgba(255, 20, 147, 0.8);
}

.emoji {
  margin-left: 6px;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: #FFFF00;
  text-shadow: 
    0 0 15px rgba(255, 255, 0, 1),
    0 0 30px rgba(255, 255, 0, 0.5);
  animation: glow-vip 1.5s ease-in-out infinite;
}

@keyframes glow-vip {
  0%, 100% {
    text-shadow: 
      0 0 15px rgba(255, 255, 0, 1),
      0 0 30px rgba(255, 255, 0, 0.5);
  }
  50% {
    text-shadow: 
      0 0 25px rgba(255, 255, 0, 1),
      0 0 50px rgba(255, 255, 0, 0.8),
      0 0 70px rgba(255, 255, 0, 0.3);
  }
}

.responsive-table {
  min-width: 980px;
}

@keyframes pulseRow {
  0% {
    opacity: 0.85;
    filter: drop-shadow(0 0 6px rgba(255, 20, 147, 0.3));
  }
  100% {
    opacity: 1;
    filter: drop-shadow(0 0 15px rgba(255, 20, 147, 0.6));
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
    border: 1px solid rgba(255, 20, 147, 0.25);
    background: rgba(10, 10, 20, 0.8);
    backdrop-filter: blur(10px);
    box-shadow: 
      inset 0 0 12px rgba(255, 20, 147, 0.08),
      0 0 12px rgba(255, 20, 147, 0.12);
    padding: 12px 0;
    border-radius: 12px;
  }

  .responsive-table td {
    display: block;
    border: none;
    border-bottom: 1px solid rgba(255, 20, 147, 0.12);
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
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(255, 20, 147, 0.6);
    text-shadow: 0 0 4px rgba(255, 20, 147, 0.25);
    font-weight: 600;
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
