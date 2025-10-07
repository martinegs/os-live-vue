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
          <span class="ops-card-label">Turno</span>
          <strong
            class="ops-card-value"
            :class="{ 'ops-card-value--inactive': !turnoActivo }"
          >
            {{ turnoActivo ? "Activo" : "Inactivo" }}
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
        <div class="ops-card">
          <span class="ops-card-label">Usuarios</span>
          <strong class="ops-card-value">18</strong>
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
      :estado-chart-data="estadoChartData"
      :estado-pie-segments="estadoPieSegments"
      :pago-chart-data="pagoChartData"
      :format-currency="formatArs"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

import OrdersInsights from "./orders/OrdersInsights.vue";
import OrdersModal from "./orders/OrdersModal.vue";
import OrdersTable from "./orders/OrdersTable.vue";
import OrdersToolbar from "./orders/OrdersToolbar.vue";

const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
const API_URL = isDev ? "https://digitaltex.ar/api/os" : "/api/os";
const SSE_URL = isDev ? "https://digitaltex.ar/realtime/stream?channel=os" : "/realtime/stream?channel=os";
const UPDATE_URL = isDev ? "https://digitaltex.ar/api/os/update" : "/api/os/update";
const CREATE_URL = isDev ? "https://digitaltex.ar/api/os/create" : "/api/os/create";

const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const formatArs = (value) => fmtARS.format(value ?? 0);

const CHUNK_SIZE = 30;

const estado = ref("cargando...");
const apiStatus = ref("desconectado");
const sseStatus = ref("desconectado");
const alertsCount = ref(0);
const turnoActivo = ref(isTurnActive());

function setApiStatus(value, meta) {
  if (apiStatus.value !== value) {
    apiStatus.value = value;
    console.info("[OrdersLive] Estado API:", value, meta ?? "");
  }
}

function setSseStatus(value, meta) {
  if (sseStatus.value !== value) {
    sseStatus.value = value;
    console.info("[OrdersLive] Estado SSE:", value, meta ?? "");
  }
}

function setEstadoUi(value, meta) {
  if (estado.value !== value) {
    estado.value = value;
    console.info("[OrdersLive] Estado UI:", value, meta ?? "");
  }
}

function registerAlert(tipo, id) {
  alertsCount.value += 1;
  console.info("[OrdersLive] Alerta registrada", { tipo, id, total: alertsCount.value });
}

function isTurnActive() {
  const hour = new Date().getHours();
  return hour >= 10 && hour < 22;
}
const q = ref("");

const mapa = reactive(new Map());

const estadoColors = {
  Presupuesto: "#CDB380",
  Cancelado: "#ef4444",
  Produccion: "#38bdf8",
  "En Producci�n": "#38bdf8",
  "En proceso": "#38bdf8",
  "Listo para entregar": "#22c55e",
  Finalizado: "#22c55e",
  Entregado: "#0ea5e9",
  _fallback: "#475569",
};

const pagoColors = {
  Pagado: "#22c55e",
  Pendiente: "#f97316",
  "A cuenta": "#38bdf8",
  "Sin costo": "#a855f7",
  _fallback: "#64748b",
};

function baseForm() {
  const now = new Date();
  const iso = now.toISOString();
  return {
    id: null,
    status: "",
    statusPago: "",
    valorTotal: 0,
    valorPagado: 0,
    pendiente: "",
    metros: "",
    senia: "",
    lugares_id: "",
    ts: iso.slice(0, 16),
    cliente_id: "",
    cliente_nombre: "",
    area: "",
    usuario_id: "",
    usuario_nombre: "",
    es_rehacer: false,
    fechaIngreso: iso.slice(0, 10),
    fechaEntrega: "",
    lugarEntrega: "",
    trabajo: "",
    descripcionProducto: "",
    clase: "seleccione",
    informacionGeneral: "",
  };
}

function coalesce(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function coalesceNumber(...values) {
  const candidate = coalesce(...values);
  if (candidate === undefined) return undefined;
  const num = Number(candidate);
  return Number.isFinite(num) ? num : undefined;
}

const editing = reactive({
  open: false,
  mode: "edit",
  saving: false,
  error: "",
  form: baseForm(),
});

const visibleCount = ref(CHUNK_SIZE);
const formattedAlerts = computed(() => alertsCount.value.toString().padStart(2, "0"));

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
    pendiente: Number(row.pendiente ?? 0),
    metros: row.metros !== undefined && row.metros !== null ? Number(row.metros) : null,
    senia: row.senia ?? null,
    lugares_id: row.lugares_id ?? null,
    ts: row.ts ?? row.dataAtualizacao ?? null,
    cliente_id: row.cliente_id ?? row.clientes_id ?? row.clienteId ?? null,
    cliente_nombre: row.cliente_nombre ?? row.nomeCliente ?? row.cliente ?? null,
    area: row.area ?? row.nome_area ?? null,
    usuario_id: row.usuario_id ?? row.usuarios_id ?? row.idUsuarios ?? null,
    usuario_nombre: row.usuario_nombre ?? row.nome ?? null,
    es_rehacer: Number(row.es_rehacer ?? row.esRehacer ?? 0),
    fechaIngreso: row.fechaIngreso ?? row.dataInicial ?? null,
    fechaEntrega: row.fechaEntrega ?? row.dataFinal ?? null,
    lugarEntrega: row.lugarEntrega ?? row.lugar ?? null,
    lugar: row.lugar ?? null,
    trabajo: row.trabajo ?? row.garantia ?? null,
    descripcionProducto: row.descripcionProducto ?? row.observacoes ?? null,
    clase: row.clase ?? row.defeito ?? "seleccione",
    informacionGeneral: row.informacionGeneral ?? row.laudoTecnico ?? null,
    esAreaClientes: Boolean(row.esAreaClientes ?? (Number(row.pagadoAreaClientes ?? 0) === 1)),
    hayNOP: Boolean(row.hayNOP ?? row.numeroOperacion),
    activityTs: -Infinity,
    _blinkUntil: 0,
  };
}

function fromEvent(msg, tipo) {
  const id = coalesceNumber(msg.id, msg.idOs);
  if (!Number.isFinite(id)) {
    return {};
  }

  const result = {
    id,
    activityTs: Date.now(),
    _blinkUntil: Date.now() + 3000,
    _evt: tipo,
  };

  const status = coalesce(msg.status_despues, msg.status);
  if (status !== undefined) result.status = status;

  const statusPago = coalesce(msg.statusPago_despues, msg.statusPago);
  if (statusPago !== undefined) result.statusPago = statusPago;

  const valorTotal = coalesceNumber(msg.valorTotal_despues, msg.valorTotal);
  if (valorTotal !== undefined) result.valorTotal = valorTotal;

  const valorPagado = coalesceNumber(msg.valorPagado_despues, msg.valorPagado);
  if (valorPagado !== undefined) result.valorPagado = valorPagado;

  const pendiente = coalesceNumber(msg.pendiente_despues, msg.pendiente);
  if (pendiente !== undefined) result.pendiente = pendiente;

  const metros = coalesceNumber(msg.metros_despues, msg.metros);
  if (metros !== undefined) result.metros = metros;

  const senia = coalesce(msg.senia_despues, msg.senia);
  if (senia !== undefined) result.senia = senia;

  const lugaresId = coalesce(msg.lugares_id_despues, msg.lugares_id);
  if (lugaresId !== undefined) result.lugares_id = lugaresId;

  const ts = coalesce(msg.ts, msg.dataAtualizacao, msg.dataAtualizacao_despues);
  if (ts !== undefined) result.ts = ts;

  const clienteId = coalesce(msg.cliente_id_despues, msg.cliente_id);
  if (clienteId !== undefined) result.cliente_id = clienteId;

  const clienteNombre = coalesce(msg.cliente_nombre_despues, msg.cliente_nombre, msg.nomeCliente);
  if (clienteNombre !== undefined) result.cliente_nombre = clienteNombre;

  const area = coalesce(msg.area_despues, msg.area, msg.nome_area);
  if (area !== undefined) result.area = area;

  const usuarioId = coalesce(msg.usuario_id_despues, msg.usuario_id, msg.idUsuarios);
  if (usuarioId !== undefined) result.usuario_id = usuarioId;

  const usuarioNombre = coalesce(msg.usuario_nombre_despues, msg.usuario_nombre, msg.nome);
  if (usuarioNombre !== undefined) result.usuario_nombre = usuarioNombre;

  const esRehacer = coalesceNumber(msg.es_rehacer_despues, msg.es_rehacer);
  if (esRehacer !== undefined) result.es_rehacer = esRehacer;

  const fechaIngreso = coalesce(msg.fechaIngreso_despues, msg.fechaIngreso, msg.dataInicial);
  if (fechaIngreso !== undefined) result.fechaIngreso = fechaIngreso;

  const fechaEntrega = coalesce(msg.fechaEntrega_despues, msg.fechaEntrega, msg.dataFinal);
  if (fechaEntrega !== undefined) result.fechaEntrega = fechaEntrega;

  const lugarEntrega = coalesce(msg.lugarEntrega_despues, msg.lugarEntrega, msg.lugar);
  if (lugarEntrega !== undefined) result.lugarEntrega = lugarEntrega;

  const lugar = coalesce(msg.lugar_despues, msg.lugar);
  if (lugar !== undefined) result.lugar = lugar;

  const trabajo = coalesce(msg.trabajo_despues, msg.trabajo, msg.garantia);
  if (trabajo !== undefined) result.trabajo = trabajo;

  const descripcionProducto = coalesce(
    msg.descripcionProducto_despues,
    msg.descripcionProducto,
    msg.descripcionProduto,
    msg.observacoes
  );
  if (descripcionProducto !== undefined) result.descripcionProducto = descripcionProducto;

  const clase = coalesce(msg.clase_despues, msg.clase, msg.defeito);
  if (clase !== undefined) result.clase = clase;

  const informacionGeneral = coalesce(
    msg.informacionGeneral_despues,
    msg.informacionGeneral,
    msg.laudoTecnico
  );
  if (informacionGeneral !== undefined) result.informacionGeneral = informacionGeneral;

  const esAreaClientesVal = coalesceNumber(
    msg.esAreaClientes_despues,
    msg.esAreaClientes,
    msg.pagadoAreaClientes
  );
  if (esAreaClientesVal !== undefined) {
    result.esAreaClientes = Number(esAreaClientesVal) === 1;
  }

  const hayNOPVal = coalesce(msg.hayNOP_despues, msg.hayNOP, msg.numeroOperacion);
  if (hayNOPVal !== undefined) result.hayNOP = Boolean(hayNOPVal);

  return result;
}

function toEditable(row) {
  const form = baseForm();
  form.id = row.id ?? row.idOs ?? null;
  form.status = row.status ?? "";
  form.statusPago = row.statusPago ?? "";
  form.valorTotal = Number(row.valorTotal ?? 0);
  form.valorPagado = Number(row.valorPagado ?? 0);
  form.pendiente = row.pendiente ?? "";
  form.metros = row.metros !== undefined && row.metros !== null ? String(row.metros) : "";
  form.senia = row.senia ?? "";
  form.lugares_id = row.lugares_id ?? row.lugarEntrega ?? row.lugar ?? "";
  form.ts = row.ts ? new Date(row.ts).toISOString().slice(0, 16) : form.ts;
  form.cliente_id = row.cliente_id ?? row.clienteId ?? "";
  form.cliente_nombre = row.cliente_nombre ?? row.cliente ?? row.nomeCliente ?? "";
  form.area = row.area ?? "";
  form.usuario_id = row.usuario_id ?? row.usuarioId ?? "";
  form.usuario_nombre = row.usuario_nombre ?? row.nome ?? "";
  form.es_rehacer = Boolean(row.es_rehacer ?? row.esRehacer ?? false);
  const fechaIngreso = row.fechaIngreso ?? row.fechaInicial ?? null;
  const fechaEntrega = row.fechaEntrega ?? row.fechaFinal ?? null;
  form.fechaIngreso = fechaIngreso ? new Date(fechaIngreso).toISOString().slice(0, 10) : form.fechaIngreso;
  form.fechaEntrega = fechaEntrega ? new Date(fechaEntrega).toISOString().slice(0, 10) : "";
  form.lugarEntrega = row.lugarEntrega ?? row.lugar ?? "";
  form.trabajo = row.trabajo ?? row.descripcionProducto ?? "";
  form.descripcionProducto = row.descripcionProducto ?? row.observacoes ?? "";
  form.clase = row.clase ?? row.defeito ?? form.clase;
  form.informacionGeneral = row.informacionGeneral ?? row.laudoTecnico ?? "";
  return form;
}

function openEditor(row) {
  editing.mode = "edit";
  Object.assign(editing.form, toEditable(row));
  editing.error = "";
  editing.open = true;
}

function openCreator() {
  editing.mode = "create";
  Object.assign(editing.form, baseForm());
  editing.error = "";
  editing.open = true;
}

function closeEditor() {
  editing.open = false;
  editing.saving = false;
  editing.error = "";
}

async function submitForm() {
  console.info("[OrdersLive] Enviando formulario", { mode: editing.mode, id: editing.form.id });
  const isNew = editing.mode === "create";
  if (!editing.form.id && !isNew) {
    editing.error = "ID de orden requerido.";
    return;
  }
  let numericId = editing.form.id ? Number(editing.form.id) : null;
  if (!isNew && (!Number.isFinite(numericId) || numericId <= 0)) {
    editing.error = "ID de orden inv�lido.";
    return;
  }
  editing.saving = true;
  editing.error = "";
  const payload = {
    id: numericId,
    status: editing.form.status || null,
    statusPago: editing.form.statusPago || null,
    valorTotal: Number(editing.form.valorTotal) || 0,
    valorPagado: Number(editing.form.valorPagado) || 0,
    pendiente: editing.form.pendiente === "" ? null : Number(editing.form.pendiente),
    metros: editing.form.metros === "" ? null : Number(editing.form.metros),
    senia: editing.form.senia || null,
    lugares_id: editing.form.lugares_id || null,
    ts: editing.form.ts ? new Date(editing.form.ts).toISOString() : new Date().toISOString(),
    cliente_id: editing.form.cliente_id || null,
    cliente_nombre: editing.form.cliente_nombre || null,
    area: editing.form.area || null,
    usuario_id: editing.form.usuario_id || null,
    es_rehacer: editing.form.es_rehacer ? 1 : 0,
    fechaIngreso: editing.form.fechaIngreso || null,
    fechaEntrega: editing.form.fechaEntrega || null,
    lugarEntrega: editing.form.lugarEntrega || null,
    trabajo: editing.form.trabajo || null,
    descripcionProducto: editing.form.descripcionProducto || null,
    clase: editing.form.clase || null,
    informacionGeneral: editing.form.informacionGeneral || null,
  };
  const url = editing.mode === "create" ? CREATE_URL : UPDATE_URL;
  const method = editing.mode === "create" ? "POST" : "PUT";
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let body = {};
    try {
      body = await res.json();
    } catch {
      body = {};
    }
    if (body && body.result === false) {
      throw new Error(body.message || "Actualizaci�n rechazada por el servidor");
    }
    if (!numericId && body && body.id) {
      numericId = Number(body.id);
    }
    if (!numericId) {
      numericId = Date.now();
    }
    editing.form.id = numericId;
    payload.id = numericId;
    const prev = mapa.get(payload.id) || {};
    const updated = {
      ...prev,
      ...payload,
      activityTs: Date.now(),
      _blinkUntil: Date.now() + 3000,
    };
    upsertRow(mapa, updated);
    closeEditor();
    console.info("[OrdersLive] Orden guardada", { id: numericId, mode: editing.mode });
  } catch (err) {
    editing.error = err instanceof Error ? err.message : String(err);
    console.error("[OrdersLive] Error al guardar orden", err);
  } finally {
    editing.saving = false;
  }
}

async function cargarAPI() {
  console.info("[OrdersLive] Iniciando carga inicial", { API_URL });
  try {
    const res = await fetch(API_URL, { credentials: "omit" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const rows = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : []);
    if (!rows.length) throw new Error("sin filas");

    mapa.clear();
    for (const r of rows) {
      const parsed = fromAPI(r);
      if (Number.isFinite(parsed.id)) upsertRow(mapa, parsed);
    }
    console.info("[OrdersLive] API cargada", { rows: rows.length });
    setApiStatus("conectado", "(respuesta inicial)");
    setEstadoUi("cargando stream...", "(post API)");
  } catch (e) {
    console.error("[OrdersLive] Error al cargar API", e);
    setApiStatus("desconectado", "(fallo API)");
    setEstadoUi(`error API (${e.message})`);
  }
}

let es;
function conectarSSE() {
  console.info("[OrdersLive] Conectando SSE", { SSE_URL });
  es = new EventSource(SSE_URL, { withCredentials: true });

  const apply = (tipo, ev) => {
    try {
      const msg = JSON.parse(ev.data);
      const row = fromEvent(msg, tipo);
      if (!Number.isFinite(row.id)) return;
      if (tipo === "delete") {
        mapa.delete(row.id);
      } else {
        upsertRow(mapa, row);
      }
      registerAlert(tipo, row.id);
      console.debug("[OrdersLive] Evento SSE aplicado", { tipo, id: row.id });
    } catch {}
  };

  es.addEventListener("insert", (e) => apply("insert", e));
  es.addEventListener("update", (e) => apply("update", e));
  es.addEventListener("delete", (e) => apply("delete", e));
  es.onopen = () => {
    console.info("[OrdersLive] SSE conectado");
    setSseStatus("conectado");
    if (apiStatus.value === "conectado") setEstadoUi("conectado", "(SSE abierto)");
  };
  es.onerror = (err) => {
    console.warn("[OrdersLive] SSE error", err);
    setSseStatus("desconectado", "(fallo SSE)");
    setEstadoUi("reconectando...");
  };
}

let ticker;
function startTicker() {
  ticker = setInterval(() => {
    const now = Date.now();
    for (const [id, row] of mapa) {
      if (row._blinkUntil && row._blinkUntil < now) {
        mapa.set(id, { ...row, _blinkUntil: 0 });
      }
    }
    const activeNow = isTurnActive();
    if (turnoActivo.value !== activeNow) {
      turnoActivo.value = activeNow;
    }
  }, 500);
}

const filasFiltradas = computed(() => {
  const term = q.value.trim().toLowerCase();
  const arr = Array.from(mapa.values());
  if (!term) return arr;
  return arr.filter((row) => {
    const tokens = [
      row.id,
      row.status,
      row.statusPago,
      row.cliente_nombre,
      row.lugarEntrega,
      row.trabajo,
      row.metros,
    ]
      .map((v) => (v ?? "").toString().toLowerCase());
    return tokens.some((t) => t.includes(term));
  });
});

const filasOrdenadas = computed(() => {
  const arr = [...filasFiltradas.value];
  return arr.sort((a, b) => {
    if (a.activityTs !== b.activityTs) return b.activityTs - a.activityTs;
    return b.id - a.id;
  });
});

const visibleRows = computed(() => {
  if (!visibleCount.value) return filasOrdenadas.value.slice(0, CHUNK_SIZE);
  return filasOrdenadas.value.slice(0, visibleCount.value);
});

const stats = computed(() => {
  const rows = filasOrdenadas.value;
  const totalOrdenes = rows.length;
  let totalFacturado = 0;
  let totalPagado = 0;
  let totalPendiente = 0;
  let totalMetros = 0;
  let ordenesConMetros = 0;
  const estadoCount = new Map();
  const pagoCount = new Map();

  for (const row of rows) {
    const valorTotal = Number(row.valorTotal ?? 0) || 0;
    const valorPagado = Number(row.valorPagado ?? 0) || 0;
    const metros = Number(row.metros ?? 0);

    totalFacturado += valorTotal;
    totalPagado += valorPagado;
    totalPendiente += Math.max(valorTotal - valorPagado, 0);

    if (Number.isFinite(metros) && metros > 0) {
      totalMetros += metros;
      ordenesConMetros += 1;
    }

    const estadoLabel = (row.status || "Sin estado").trim() || "Sin estado";
    estadoCount.set(estadoLabel, (estadoCount.get(estadoLabel) ?? 0) + 1);

    const pagoLabel = (row.statusPago || "Sin pago").trim() || "Sin pago";
    pagoCount.set(pagoLabel, (pagoCount.get(pagoLabel) ?? 0) + 1);
  }

  const ticketPromedio = totalOrdenes ? totalFacturado / totalOrdenes : 0;
  const promedioPagado = totalOrdenes ? totalPagado / totalOrdenes : 0;

  return {
    totalOrdenes,
    totalFacturado,
    totalPagado,
    totalPendiente,
    totalMetros: totalMetros % 1 === 0 ? totalMetros : totalMetros.toFixed(2),
    ordenesConMetros,
    ticketPromedio,
    promedioPagado,
    estadoCount,
    estadoTotal: estadoCount.size,
    pagoCount,
  };
});

const estadoChartData = computed(() => {
  const total = stats.value.totalOrdenes || 1;
  const palette = ["#38bdf8", "#a855f7", "#f97316", "#22c55e", "#facc15", "#ef4444", "#14b8a6"];
  let index = 0;
  return Array.from(stats.value.estadoCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, cantidad]) => {
      const color = palette[index % palette.length];
      index += 1;
      return {
        label,
        cantidad,
        porcentaje: (cantidad / total) * 100,
        color,
      };
    });
});

const pagoChartData = computed(() => {
  const total = stats.value.totalOrdenes || 1;
  const palette = ["#22c55e", "#38bdf8", "#f97316", "#facc15", "#a855f7", "#ef4444"];
  let index = 0;
  return Array.from(stats.value.pagoCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, cantidad]) => {
      const color = palette[index % palette.length];
      index += 1;
      return {
        label,
        cantidad,
        porcentaje: total ? (cantidad / total) * 100 : 0,
        color,
      };
    });
});

const estadoPieSegments = computed(() => {
  const circumference = 2 * Math.PI * 42;
  const total = stats.value.totalOrdenes || 0;
  if (!total) return [];

  let offset = 0;
  return estadoChartData.value.map((item) => {
    const fraction = item.cantidad / total;
    const length = fraction * circumference;
    const segment = {
      ...item,
      dashArray: `${length} ${circumference - length}`,
      dashOffset: -offset,
    };
    offset += length;
    return segment;
  });
});

onMounted(async () => {
  console.info("[OrdersLive] Componente montado");
  await cargarAPI();
  conectarSSE();
  startTicker();
});

onBeforeUnmount(() => {
  if (es) es.close();
  if (ticker) clearInterval(ticker);
});

watch(q, () => {
  visibleCount.value = CHUNK_SIZE;
});

watch(
  () => filasFiltradas.value.length,
  (len) => {
    if (len < CHUNK_SIZE) {
      visibleCount.value = len;
    } else if (visibleCount.value > len) {
      visibleCount.value = len;
    }
  }
);

function loadMoreRows() {
  const total = filasOrdenadas.value.length;
  if (visibleCount.value < total) {
    visibleCount.value = Math.min(visibleCount.value + CHUNK_SIZE, total);
  }
}
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
