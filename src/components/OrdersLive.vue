<template>
  <div class="wrap">
    <h2 class="title">Órdenes</h2>

    <!-- Cartel de estado -->
    <div class="status">
      <div>API: <Pill :ok="apiStatus === 'conectado'" :label="apiStatus" /></div>
      <div>SSE: <Pill :ok="sseStatus === 'conectado'" :label="sseStatus" /></div>
      <small class="muted">| Estado: {{ estado }}</small>
    </div>

    <!-- Buscador -->
    <div class="toolbar">
      <input
        v-model="q"
        type="text"
        placeholder="Buscar (OT, estado, pago, lugar, metros)"
        class="input"
      />
    </div>

    <div class="tablewrap">
      <table class="table">
        <thead>
          <tr>
            <th v-for="h in headers" :key="h">{{ h }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filasOrdenadas.length === 0">
            <td class="td" :colspan="headers.length">Sin datos todavía</td>
          </tr>
          <tr v-for="r in filasOrdenadas" :key="r.id">
            <td :class="tdClass(r)">{{ r.id }}</td>
            <td :class="tdClass(r)">{{ r.status ?? '—' }}</td>
            <td :class="tdClass(r)"><Badge :text="r.statusPago" /></td>
            <td :class="tdClass(r)">{{ fmtARS.format(r.valorTotal) }} / {{ fmtARS.format(r.valorPagado) }}</td>
            <td :class="tdClass(r)">{{ r.pendiente ?? '—' }}</td>
            <td :class="tdClass(r)">{{ r.metros ?? '—' }}</td>
            <td :class="tdClass(r)">{{ r.senia ?? '—' }}</td>
            <td :class="tdClass(r)">{{ r.lugares_id ?? '—' }}</td>
            <td :class="tdClass(r)">{{ r.ts ? new Date(r.ts).toLocaleString() : '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";

// ===== Config DEV/PROD =====
const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
const API_URL = isDev ? "https://digitaltex.ar/api/os" : "/api/os";
const SSE_URL = isDev ? "https://digitaltex.ar/realtime/stream?channel=os" : "/realtime/stream?channel=os";

// ===== Formato moneda =====
const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

// ===== Estado UI =====
const estado = ref("cargando…");
const apiStatus = ref("desconectado");
const sseStatus = ref("desconectado");
const q = ref("");

// Estructura: Map<number, Row>
const mapa = reactive(new Map());

// Helpers UI
const headers = ["OT","Estado","Pago","Total / Pagado","Pendiente","Metros","Seña","Lugar","Último evento"];
const tdClass = (r) => ({
  td: true,
  blink: r._blinkUntil && r._blinkUntil > Date.now(),
});

// ===== Componentes pequeños =====
const Pill = {
  props: { ok: Boolean, label: String },
  template: `
    <span :style="styleObj">{{ label }}</span>
  `,
  computed: {
    styleObj() {
      return {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        border: "1px solid",
        background: this.ok ? "#e8f5e9" : "#ffebee",
        borderColor: this.ok ? "#2e7d32" : "#c62828",
        color: this.ok ? "#2e7d32" : "#c62828",
      };
    }
  }
};

const Badge = {
  props: { text: String },
  computed: {
    ok() { return (this.text || "").toLowerCase().includes("pagado"); },
    styleObj() {
      return {
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        border: "1px solid",
        background: this.ok ? "#e8f5e9" : "#fff3e0",
        borderColor: this.ok ? "#2e7d32" : "#ef6c00",
        color: this.ok ? "#2e7d32" : "#ef6c00",
      };
    }
  },
  template: `<span :style="styleObj">{{ text || "—" }}</span>`
};

// ===== Normalizadores =====
function upsertRow(m, row) {
  const prev = m.get(row.id) || {};
  m.set(row.id, { ...prev, ...row });
}
function fromAPI(row) {
  return {
    id: Number(row.id ?? row.idOs),
    status: row.status ?? null,
    statusPago: row.statusPago ?? null,
    valorTotal: Number(row.valorTotal ?? 0),
    valorPagado: Number(row.valorPagado ?? 0),
    pendiente: row.pendiente ?? null,
    metros: row.metros ?? null,
    senia: row.senia ?? null,
    lugares_id: row.lugares_id ?? null,
    ts: null,
    activityTs: -Infinity,   // base: OT desc
    _blinkUntil: 0
  };
}
function fromEvent(msg, tipo) {
  return {
    id: Number(msg.id ?? msg.idOs),
    status: msg.status_despues ?? msg.status ?? null,
    statusPago: msg.statusPago_despues ?? msg.statusPago ?? null,
    valorTotal: Number(msg.valorTotal_despues ?? msg.valorTotal ?? 0),
    valorPagado: Number(msg.valorPagado_despues ?? msg.valorPagado ?? 0),
    pendiente: msg.pendiente_despues ?? msg.pendiente ?? null,
    metros: msg.metros_despues ?? msg.metros ?? null,
    senia: msg.senia_despues ?? msg.senia ?? null,
    lugares_id: msg.lugares_id_despues ?? msg.lugares_id ?? null,
    ts: msg.ts ?? new Date().toISOString(),
    activityTs: Date.now(),          // última editada/creada arriba
    _blinkUntil: Date.now() + 3000,
    _evt: tipo
  };
}

// ===== Carga inicial =====
async function cargarAPI() {
  try {
    const res = await fetch(API_URL, { credentials: "omit" }); // sin cookies en dev
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : []);
    if (!rows.length) throw new Error("sin filas");

    mapa.clear();
    for (const r of rows) {
      const parsed = fromAPI(r);
      if (Number.isFinite(parsed.id)) upsertRow(mapa, parsed);
    }
    apiStatus.value = "conectado";
    estado.value = "cargando stream…";
  } catch (e) {
    console.error("API falló:", e);
    apiStatus.value = "desconectado";
    estado.value = `error API (${e.message})`;
  }
}

// ===== SSE =====
let es;
function conectarSSE() {
  es = new EventSource(SSE_URL, { withCredentials: true });

  function apply(tipo, ev) {
    try {
      const msg = JSON.parse(ev.data);
      const row = fromEvent(msg, tipo);
      if (!Number.isFinite(row.id)) return;
      if (tipo === "delete") mapa.delete(row.id);
      else upsertRow(mapa, row);
    } catch {}
  }

  es.addEventListener("insert", (e) => apply("insert", e));
  es.addEventListener("update", (e) => apply("update", e));
  es.addEventListener("delete", (e) => apply("delete", e));
  es.onopen  = () => { sseStatus.value = "conectado"; if (apiStatus.value === "conectado") estado.value = "conectado"; };
  es.onerror = () => { sseStatus.value = "desconectado"; estado.value = "reconectando…"; };
}

// ===== Limpieza de blink =====
let ticker;
function startTicker() {
  ticker = setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const [id, row] of mapa) {
      if (row._blinkUntil && row._blinkUntil < now) {
        mapa.set(id, { ...row, _blinkUntil: 0 });
        changed = true;
      }
    }
    // (mapa es reactive; no hace falta forzar set si no cambió nada)
  }, 500);
}

// ===== Orden y filtro =====
const filasOrdenadas = computed(() => {
  let arr = Array.from(mapa.values());
  if (q.value) {
    const qq = q.value.toLowerCase();
    arr = arr.filter(r =>
      String(r.id).includes(qq) ||
      (r.status || "").toLowerCase().includes(qq) ||
      (r.statusPago || "").toLowerCase().includes(qq) ||
      (r.lugares_id || "").toLowerCase().includes(qq) ||
      (r.metros || "").toLowerCase().includes(qq)
    );
  }
  return arr.sort((a, b) => {
    if (a.activityTs !== b.activityTs) return b.activityTs - a.activityTs; // última actividad arriba
    return b.id - a.id; // base: OT desc
  });
});

// ===== Ciclo de vida =====
onMounted(async () => {
  await cargarAPI();
  conectarSSE();
  startTicker();
});
onBeforeUnmount(() => {
  if (es) es.close();
  if (ticker) clearInterval(ticker);
});
</script>

<style scoped>
.wrap { max-width: 1100px; margin: 24px auto; padding: 0 12px; }
.title { margin: 0 0 8px 0; }
.status { display: flex; gap: 24px; align-items: center; font-size: 14px; margin-bottom: 12px; }
.muted { opacity: .6; }
.toolbar { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-bottom: 12px; }
.input { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; flex: 1 1 320px; }
.tablewrap { overflow-x: auto; }
.table { width: 100%; border-collapse: collapse; }
th { text-align: left; border-bottom: 1px solid #ddd; padding: 8px; white-space: nowrap; }
.td, td { border-bottom: 1px solid #f3f3f3; padding: 8px; white-space: nowrap; transition: background .4s; }
.blink { background: #fffde7; }
</style>
