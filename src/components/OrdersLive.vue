<template>
  <div class="wrap">
    <h2 class="title">Ordenes</h2>

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
      <button type="button" class="toolbar-btn" @click="openCreator">
        + Nueva orden
      </button>
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
            <td class="td" :colspan="headers.length">Sin datos todavia</td>
          </tr>
          <tr v-for="r in filasOrdenadas" :key="r.id" class="row-click" @click="openEditor(r)">
            <td :class="tdClass(r)">{{ r.id }}</td>
            <td :class="tdClass(r)">{{ r.status ?? "-" }}</td>
            <td :class="tdClass(r)"><Badge :text="r.statusPago" /></td>
            <td :class="tdClass(r)">{{ fmtARS.format(r.valorTotal) }} / {{ fmtARS.format(r.valorPagado) }}</td>
            <td :class="tdClass(r)">{{ r.pendiente ?? "-" }}</td>
            <td :class="tdClass(r)">{{ r.metros ?? "-" }}</td>
            <td :class="tdClass(r)">{{ r.senia ?? "-" }}</td>
            <td :class="tdClass(r)">{{ r.lugares_id ?? "-" }}</td>
            <td :class="tdClass(r)">{{ r.ts ? new Date(r.ts).toLocaleString() : "-" }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <transition name="modal">
      <div v-if="editing.open" class="modal-backdrop" @click.self="closeEditor">
        <div class="modal-card">
          <header class="modal-header">
            <h3>{{ editing.mode === "create" ? "Nueva orden" : "Editar orden #" + editing.form.id }}</h3>
            <button type="button" class="modal-close" @click="closeEditor" aria-label="Cerrar editor">×</button>
          </header>
          <form class="modal-body" @submit.prevent="submitForm">
            <div class="form-grid">
              <label class="form-field">
                <span>ID</span>
                <input type="number" v-model="editing.form.id" readonly />
              </label>
              <label class="form-field">
                <span>Estado</span>
                <input type="text" v-model="editing.form.status" />
              </label>
              <label class="form-field">
                <span>Estado pago</span>
                <input type="text" v-model="editing.form.statusPago" />
              </label>
              <label class="form-field">
                <span>Valor total (ARS)</span>
                <input type="number" step="0.01" v-model="editing.form.valorTotal" />
              </label>
              <label class="form-field">
                <span>Valor pagado (ARS)</span>
                <input type="number" step="0.01" v-model="editing.form.valorPagado" />
              </label>
              <label class="form-field">
                <span>Pendiente</span>
                <input type="text" v-model="editing.form.pendiente" />
              </label>
              <label class="form-field">
                <span>Metros</span>
                <input type="text" v-model="editing.form.metros" />
              </label>
              <label class="form-field">
                <span>Seña</span>
                <input type="text" v-model="editing.form.senia" />
              </label>
              <label class="form-field">
                <span>Lugar</span>
                <input type="text" v-model="editing.form.lugares_id" />
              </label>
              <label class="form-field">
                <span>Fecha evento</span>
                <input type="datetime-local" v-model="editing.form.ts" />
              </label>
            </div>
            <div class="form-grid">
              <label class="form-field">
                <span>ID cliente</span>
                <input type="text" v-model="editing.form.cliente_id" />
              </label>
              <label class="form-field">
                <span>Nombre cliente</span>
                <input type="text" v-model="editing.form.cliente_nombre" />
              </label>
              <label class="form-field">
                <span>Área</span>
                <input type="text" v-model="editing.form.area" />
              </label>
              <label class="form-field">
                <span>Usuario ID</span>
                <input type="text" v-model="editing.form.usuario_id" />
              </label>
              <label class="form-field form-field--toggle">
                <span>Rehacer</span>
                <label class="form-toggle">
                  <input type="checkbox" v-model="editing.form.es_rehacer" />
                  <span>Marcar como rehacer</span>
                </label>
              </label>
            </div>
            <div class="form-grid">
              <label class="form-field">
                <span>Fecha ingreso</span>
                <input type="date" v-model="editing.form.fechaIngreso" />
              </label>
              <label class="form-field">
                <span>Entrega estimada</span>
                <input type="date" v-model="editing.form.fechaEntrega" />
              </label>
              <label class="form-field">
                <span>Lugar de entrega</span>
                <input type="text" v-model="editing.form.lugarEntrega" />
              </label>
              <label class="form-field">
                <span>Clase</span>
                <select v-model="editing.form.clase">
                  <option value="seleccione">Seleccione</option>
                  <option value="Solo Papel">Solo Papel</option>
                  <option value="DTF + Marca">DTF + Marca</option>
                  <option value="Tela + Sublimacion">Tela + Sublimacion</option>
                  <option value="Tela de Cliente + Subli">Tela de Cliente + Subli</option>
                  <option value="Confeccion">Confeccion</option>
                  <option value="Otro">Otro</option>
                </select>
              </label>
              <label class="form-field">
                <span>Trabajo</span>
                <input type="text" v-model="editing.form.trabajo" />
              </label>
            </div>
            <div class="form-grid form-grid--full">
              <label class="form-field">
                <span>Tipo de trabajo / Producto</span>
                <textarea rows="3" v-model="editing.form.descripcionProducto"></textarea>
              </label>
              <label class="form-field">
                <span>Información general</span>
                <textarea rows="3" v-model="editing.form.informacionGeneral"></textarea>
              </label>
            </div>
            <p v-if="editing.error" class="form-error">{{ editing.error }}</p>
            <footer class="modal-actions">
              <button type="button" class="btn ghost" @click="closeEditor">Cancelar</button>
              <button type="submit" class="btn primary" :disabled="editing.saving">
                <span v-if="editing.saving" class="spinner"></span>
                <span>
                  {{
                    editing.saving
                      ? (editing.mode === "create" ? "Creando..." : "Guardando...")
                      : (editing.mode === "create" ? "Crear orden" : "Guardar cambios")
                  }}
                </span>
              </button>
            </footer>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";

// ===== Config DEV/PROD =====
const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
const API_URL = isDev ? "https://digitaltex.ar/api/os" : "/api/os";
const SSE_URL = isDev ? "https://digitaltex.ar/realtime/stream?channel=os" : "/realtime/stream?channel=os";
const UPDATE_URL = isDev ? "https://digitaltex.ar/api/os/update" : "/api/os/update";
const CREATE_URL = isDev ? "https://digitaltex.ar/api/os/create" : "/api/os/create";

// ===== Formato moneda =====
const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });

// ===== Estado UI =====
const estado = ref("cargando...");
const apiStatus = ref("desconectado");
const sseStatus = ref("desconectado");
const q = ref("");

// Estructura: Map<number, Row>
const mapa = reactive(new Map());

function baseForm() {
  const now = new Date();
  const isoDate = now.toISOString();
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
    ts: isoDate.slice(0, 16),
    cliente_id: "",
    cliente_nombre: "",
    area: "",
    usuario_id: "",
    es_rehacer: false,
    fechaIngreso: isoDate.slice(0, 10),
    fechaEntrega: "",
    lugarEntrega: "",
    trabajo: "",
    descripcionProducto: "",
    clase: "seleccione",
    informacionGeneral: "",
  };
}

const editing = reactive({
  open: false,
  mode: "edit",
  saving: false,
  error: "",
  form: baseForm(),
});

// Helpers UI
const headers = ["OT","Estado","Pago","Total / Pagado","Pendiente","Metros","Sena","Lugar","Ultimo evento"];
const tdClass = (r) => ({
  td: true,
  blink: r._blinkUntil && r._blinkUntil > Date.now(),
});

// ===== Componentes pequenos =====
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
    ts: row.ts ?? null,
    cliente_id: row.cliente_id ?? row.clienteId ?? null,
    cliente_nombre: row.cliente_nombre ?? row.cliente ?? null,
    area: row.area ?? null,
    usuario_id: row.usuario_id ?? row.usuarioId ?? null,
    es_rehacer: row.es_rehacer ?? row.esRehacer ?? 0,
    fechaIngreso: row.fechaIngreso ?? row.fechaInicial ?? null,
    fechaEntrega: row.fechaEntrega ?? row.fechaFinal ?? null,
    lugarEntrega: row.lugarEntrega ?? null,
    trabajo: row.trabajo ?? null,
    descripcionProducto: row.descripcionProducto ?? null,
    clase: row.clase ?? "seleccione",
    informacionGeneral: row.informacionGeneral ?? null,
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
    cliente_id: msg.cliente_id_despues ?? msg.cliente_id ?? null,
    cliente_nombre: msg.cliente_nombre_despues ?? msg.cliente_nombre ?? null,
    area: msg.area_despues ?? msg.area ?? null,
    usuario_id: msg.usuario_id_despues ?? msg.usuario_id ?? null,
    es_rehacer: msg.es_rehacer_despues ?? msg.es_rehacer ?? 0,
    fechaIngreso: msg.fechaIngreso_despues ?? msg.fechaIngreso ?? null,
    fechaEntrega: msg.fechaEntrega_despues ?? msg.fechaEntrega ?? null,
    lugarEntrega: msg.lugarEntrega_despues ?? msg.lugarEntrega ?? null,
    trabajo: msg.trabajo_despues ?? msg.trabajo ?? null,
    descripcionProducto: msg.descripcionProducto_despues ?? msg.descripcionProducto ?? null,
    clase: msg.clase_despues ?? msg.clase ?? "seleccione",
    informacionGeneral: msg.informacionGeneral_despues ?? msg.informacionGeneral ?? null,
    activityTs: Date.now(),          // Ultima editada/creada arriba
    _blinkUntil: Date.now() + 3000,
    _evt: tipo
  };
}

function toEditable(row) {
  const form = baseForm();
  form.id = row.id ?? row.idOs ?? null;
  form.status = row.status ?? "";
  form.statusPago = row.statusPago ?? "";
  form.valorTotal = Number(row.valorTotal ?? 0);
  form.valorPagado = Number(row.valorPagado ?? 0);
  form.pendiente = row.pendiente ?? "";
  form.metros = row.metros ?? "";
  form.senia = row.senia ?? "";
  form.lugares_id = row.lugares_id ?? row.lugarEntrega ?? "";
  form.ts = row.ts ? new Date(row.ts).toISOString().slice(0, 16) : form.ts;
  form.cliente_id = row.cliente_id ?? row.clienteId ?? "";
  form.cliente_nombre = row.cliente_nombre ?? row.cliente ?? "";
  form.area = row.area ?? "";
  form.usuario_id = row.usuario_id ?? row.usuarioId ?? "";
  form.es_rehacer = Boolean(row.es_rehacer ?? row.esRehacer ?? false);
  const fechaIngreso = row.fechaIngreso ?? row.fechaInicial ?? null;
  const fechaEntrega = row.fechaEntrega ?? row.fechaFinal ?? null;
  form.fechaIngreso = fechaIngreso ? new Date(fechaIngreso).toISOString().slice(0, 10) : form.fechaIngreso;
  form.fechaEntrega = fechaEntrega ? new Date(fechaEntrega).toISOString().slice(0, 10) : "";
  form.lugarEntrega = row.lugarEntrega ?? "";
  form.trabajo = row.trabajo ?? "";
  form.descripcionProducto = row.descripcionProducto ?? "";
  form.clase = row.clase ?? form.clase;
  form.informacionGeneral = row.informacionGeneral ?? "";
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
  const isNew = editing.mode === "create";
  if (!editing.form.id && !isNew) {
    editing.error = "ID de orden requerido.";
    return;
  }
  let numericId = editing.form.id ? Number(editing.form.id) : null;
  if (!isNew && (!Number.isFinite(numericId) || numericId <= 0)) {
    editing.error = "ID de orden inválido.";
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
    pendiente: editing.form.pendiente || null,
    metros: editing.form.metros || null,
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
  if (!numericId && body && body.id) {
    numericId = Number(body.id);
  }
  if (!numericId) {
    numericId = Date.now();
  }
  editing.form.id = numericId;
  const url = editing.mode === "create" ? CREATE_URL : UPDATE_URL;
  const method = editing.mode === "create" ? "POST" : "PUT";
  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    let body = {};
    try {
      body = await res.json();
    } catch {
      body = {};
    }
    if (body && body.result === false) {
      throw new Error(body.message || "Actualizacion rechazada por el servidor");
    }
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
  } catch (err) {
    editing.error = err instanceof Error ? err.message : String(err);
  } finally {
    editing.saving = false;
  }
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
    estado.value = "cargando stream...";
  } catch (e) {
    console.error("API fallo:", e);
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
  es.onerror = () => { sseStatus.value = "desconectado"; estado.value = "reconectando..."; };
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
    // (mapa es reactive; no hace falta forzar set si no cambio nada)
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
    if (a.activityTs !== b.activityTs) return b.activityTs - a.activityTs; // Ultima actividad arriba
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
.wrap {
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 32px;
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

.status {
  display: flex;
  gap: 24px;
  align-items: center;
  font-size: 13px;
  margin-bottom: 16px;
  color: rgba(226, 232, 240, 0.75);
}

.muted {
  opacity: 0.65;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.input {
  padding: 10px 14px;
  border-radius: 14px;
  flex: 1 1 320px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #e2e8f0;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.toolbar-btn {
  border: none;
  border-radius: 999px;
  padding: 10px 16px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.65), rgba(37, 99, 235, 0.65));
  color: #f8fafc;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 8px 18px rgba(236, 72, 153, 0.35);
}

.toolbar-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(236, 72, 153, 0.45);
}

.input::placeholder {
  color: rgba(148, 163, 184, 0.6);
}

.input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.25),
    0 0 18px rgba(37, 99, 235, 0.35);
}

.tablewrap {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 640px;
  border-radius: 18px;
  border: 1px solid rgba(56, 189, 248, 0.25);
  background: rgba(6, 11, 25, 0.92);
  box-shadow:
    0 16px 40px rgba(14, 165, 233, 0.18),
    inset 0 0 16px rgba(30, 64, 175, 0.16);
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

.row-click {
  cursor: pointer;
}

.td,
td {
  padding: 10px 14px;
  white-space: nowrap;
  border-bottom: 1px solid rgba(30, 58, 138, 0.45);
  border-right: 1px solid rgba(37, 99, 235, 0.28);
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.td:last-child,
td:last-child {
  border-right: none;
}

.blink {
  background: linear-gradient(90deg, rgba(124, 58, 237, 0.35), rgba(236, 72, 153, 0.35)) !important;
  box-shadow:
    inset 0 0 18px rgba(236, 72, 153, 0.55),
    0 0 14px rgba(236, 72, 153, 0.3);
  animation: pulseRow 1.1s ease-in-out infinite alternate;
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

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(9, 15, 29, 0.85);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 1000;
}

.modal-card {
  width: min(620px, 100%);
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(15, 23, 42, 0.95)),
    rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 16px;
  box-shadow:
    0 24px 60px rgba(37, 99, 235, 0.25),
    inset 0 0 18px rgba(30, 64, 175, 0.25);
  color: #e8edff;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.modal-close {
  border: none;
  background: transparent;
  color: #94a3b8;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.modal-close:hover {
  color: #f8fafc;
}

.modal-body {
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px 18px;
}

.form-grid--full {
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.85);
}

.form-field input,
.form-field select,
.form-field textarea {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.form-field textarea {
  resize: vertical;
  min-height: 90px;
}

.form-field select {
  cursor: pointer;
}

.form-field input[readonly] {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-field input:focus,
.form-field select:focus,
.form-field textarea:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow:
    0 0 0 2px rgba(37, 99, 235, 0.25),
    0 0 14px rgba(37, 99, 235, 0.35);
}

.form-field--toggle {
  justify-content: flex-end;
}

.form-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  text-transform: none;
  letter-spacing: 0.08em;
  color: rgba(226, 232, 240, 0.8);
}

.form-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #ec4899;
}

.form-error {
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(248, 113, 113, 0.14);
  border: 1px solid rgba(248, 113, 113, 0.35);
  color: #fecaca;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn {
  border: none;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 14px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn.primary {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(14, 165, 233, 0.6));
  color: #f8fafc;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4);
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.45);
}

.btn.ghost {
  background: rgba(15, 23, 42, 0.6);
  color: rgba(226, 232, 240, 0.85);
  border: 1px solid rgba(148, 163, 184, 0.35);
}

.btn.ghost:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.35);
}

.spinner {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 2px solid rgba(240, 249, 255, 0.4);
  border-top-color: rgba(240, 249, 255, 0.95);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .modal-card {
    padding: 0;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>









