import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

const DEFAULT_CHUNK_SIZE = 30;

const LOCATION_LABELS = Object.freeze({
  LM: "Mendoza",
  LC: "Capital Federal",
});

export const ESTADO_COLORS = Object.freeze({
  Presupuesto: "#CDB380",
  Cancelado: "#ef4444",
  Produccion: "#38bdf8",
  "En Producción": "#38bdf8",
  "En proceso": "#38bdf8",
  "Listo para entregar": "#22c55e",
  Finalizado: "#22c55e",
  Entregado: "#0ea5e9",
  _fallback: "#475569",
});

export const PAGO_COLORS = Object.freeze({
  Pagado: "#22c55e",
  Pendiente: "#f97316",
  "A cuenta": "#38bdf8",
  "Sin costo": "#a855f7",
  _fallback: "#64748b",
});

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

function createBaseForm() {
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

function upsertRow(map, row) {
  const prev = map.get(row.id) || {};
  map.set(row.id, { ...prev, ...row });
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
    dataInicial: row.dataInicial ?? null,
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
    fechaPago: row.fechaPago ?? null,
    esAreaClientes: Boolean(row.esAreaClientes ?? (Number(row.pagadoAreaClientes ?? 0) === 1)),
    hayNOP: Boolean(row.hayNOP ?? row.numeroOperacion),
    activityTs: -Infinity,
    _blinkUntil: 0,
  };
}

function fromEvent(msg, tipo) {
  const id = coalesceNumber(msg.id, msg.idOs);
  if (!Number.isFinite(id)) return {};

  const result = {
    id,
    activityTs: Date.now(),
    _blinkUntil: Date.now() + (tipo === "delete" ? 0 : 3000),
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

  const fechaPago = coalesce(msg.fechaPago_despues, msg.fechaPago);
  if (fechaPago !== undefined) result.fechaPago = fechaPago;

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

function normalizeEndpoint(base) {
  return String(base || "").replace(/\/+$/, "");
}

function resolveUpdateUrl(template, id) {
  const strId = String(id);
  if (!template) return strId;
  if (template.includes("{id}")) return template.replace("{id}", strId);
  if (template.includes(":id")) return template.replace(":id", strId);
  return `${normalizeEndpoint(template)}/${strId}`;
}

function toEditable(row) {
  const form = createBaseForm();
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

/**
 * Exposes reactive state, derived metrics and realtime wiring for the orders dashboard.
 * Endpoints are configurable so the same composable works in dev (remote API) and prod (relative paths).
 */
export function useOrdersLive(options = {}) {
  const {
    apiUrl = "/api/os",
    sseUrl = "/realtime/stream?channel=os",
    updateUrl = null,
    createUrl = null,
    chunkSize = DEFAULT_CHUNK_SIZE,
  } = options;
  const paymentsUrl = options.paymentsUrl || "/api/lancamentos/summary";
  const createEndpoint = (createUrl || apiUrl) || "/api/os";
  const updateEndpoint = (updateUrl || apiUrl) || "/api/os";

  const estado = ref("cargando...");
  const apiStatus = ref("desconectado");
  const sseStatus = ref("desconectado");
  const alertsCount = ref(0);
  const resumenPagos = ref({ date: '', operaciones: 0, totalNeto: 0 });
  const formattedAlerts = computed(() => alertsCount.value.toString().padStart(2, "0"));

  const query = ref("");
  // Keep rows indexed by id so SSE partial payloads can be merged efficiently.
  const rowsMap = reactive(new Map());

  const editing = reactive({
    open: false,
    mode: "edit",
    saving: false,
    error: "",
    form: createBaseForm(),
  });

  const visibleCount = ref(chunkSize);

  let es;
  // Small timer to clear the "blink" flag after highlighting new/updated rows.
  let ticker;

  function setApiStatus(value, meta) {
    if (apiStatus.value === value) return;
    apiStatus.value = value;
    console.info("[OrdersLive] Estado API:", value, meta ?? "");
  }

  function setSseStatus(value, meta) {
    if (sseStatus.value === value) return;
    sseStatus.value = value;
    console.info("[OrdersLive] Estado SSE:", value, meta ?? "");
  }

  function setEstadoUi(value, meta) {
    if (estado.value === value) return;
    estado.value = value;
    console.info("[OrdersLive] Estado UI:", value, meta ?? "");
  }

  function registerAlert(tipo, id) {
    alertsCount.value += 1;
    console.info("[OrdersLive] Alerta registrada", { tipo, id, total: alertsCount.value });
  }

  // Initial API hydration so the table renders meaningful data before realtime events arrive.
  async function cargarAPI() {
    console.info("[OrdersLive] Iniciando carga inicial", { apiUrl });
    try {
      const res = await fetch(apiUrl, { credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rows = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : []);
      if (!rows.length) throw new Error("sin filas");

      rowsMap.clear();
      for (const raw of rows) {
        const parsed = fromAPI(raw);
        if (Number.isFinite(parsed.id)) upsertRow(rowsMap, parsed);
      }
      console.info("[OrdersLive] API cargada", { rows: rows.length });
      setApiStatus("conectado", "(respuesta inicial)");
      setEstadoUi("cargando stream...", "(post API)");
      // Cargar resumen de pagos del día (hoy)
      try {
        const hoy = new Date();
        const hoyStr = hoy.toISOString().slice(0, 10);
        await fetchPaymentsSummary(hoyStr);
      } catch (err) {
        console.warn('[OrdersLive] fallo cargar resumen pagos', err);
      }
    } catch (error) {
      console.error("[OrdersLive] Error al cargar API", error);
      setApiStatus("desconectado", "(fallo API)");
      setEstadoUi(`error API (${error instanceof Error ? error.message : "desconocido"})`);
    }
  }

  async function fetchPaymentsSummary(dateStr) {
    try {
      const baseApi = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? '' : '';
      // paymentsUrl may be a full URL or a path
      const separator = paymentsUrl.includes('?') ? '&' : '?';
      const url = `${paymentsUrl}${separator}date=${encodeURIComponent(dateStr)}`;
      const res = await fetch(url, { credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      resumenPagos.value = body || resumenPagos.value;
      console.info('[OrdersLive] resumenPagos cargado', { date: dateStr, totalNeto: resumenPagos.value.totalNeto });
      return resumenPagos.value;
    } catch (err) {
      console.warn('[OrdersLive] error fetchPaymentsSummary', err);
      resumenPagos.value = resumenPagos.value || { date: dateStr, operaciones: 0, totalNeto: 0 };
      return resumenPagos.value;
    }
  }

  // Subscribe to the realtime stream; merge payloads so UI stays in sync without full reloads.
  function conectarSSE() {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      console.warn("[OrdersLive] SSE no disponible en este entorno");
      return;
    }
    console.info("[OrdersLive] Conectando SSE", { sseUrl });
    es = new EventSource(sseUrl, { withCredentials: true });

    const apply = (tipo, ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const row = fromEvent(msg, tipo);
        if (!Number.isFinite(row.id)) return;
        if (tipo === "delete") {
          rowsMap.delete(row.id);
        } else {
          upsertRow(rowsMap, row);
        }
        registerAlert(tipo, row.id);
      } catch (err) {
        console.warn("[OrdersLive] Error aplicando evento", err);
      }
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

  function startTicker() {
    ticker = setInterval(() => {
      const now = Date.now();
      for (const [id, row] of rowsMap) {
        if (row._blinkUntil && row._blinkUntil < now) {
          rowsMap.set(id, { ...row, _blinkUntil: 0 });
        }
      }
    }, 500);
  }

  function stopRealtime() {
    if (es) {
      es.close();
      es = undefined;
    }
    if (ticker) {
      clearInterval(ticker);
      ticker = undefined;
    }
  }

  function openEditor(row) {
    editing.mode = "edit";
    Object.assign(editing.form, toEditable(row));
    editing.error = "";
    editing.open = true;
  }

  function openCreator() {
    editing.mode = "create";
    Object.assign(editing.form, createBaseForm());
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
    console.info("[OrdersLive] Enviando formulario", { mode: editing.mode, id: editing.form.id });

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

    const method = editing.mode === "create" ? "POST" : "PUT";
    const targetUrl =
      editing.mode === "create"
        ? createEndpoint
        : resolveUpdateUrl(updateEndpoint, numericId);

    try {
      const res = await fetch(targetUrl, {
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
        throw new Error(body.message || "Actualización rechazada por el servidor");
      }

      if (!numericId && body && body.id) {
        numericId = Number(body.id);
      }
      if (!numericId) {
        numericId = Date.now();
      }

      editing.form.id = numericId;
      payload.id = numericId;

      const prev = rowsMap.get(payload.id) || {};
      const updated = {
        ...prev,
        ...payload,
        activityTs: Date.now(),
        _blinkUntil: Date.now() + 3000,
      };
      upsertRow(rowsMap, updated);
      closeEditor();
      console.info("[OrdersLive] Orden guardada", { id: numericId, mode: editing.mode });
    } catch (error) {
      editing.error = error instanceof Error ? error.message : String(error);
      console.error("[OrdersLive] Error al guardar orden", error);
    } finally {
      editing.saving = false;
    }
  }

  const filasFiltradas = computed(() => {
    const term = query.value.trim().toLowerCase();
    const arr = Array.from(rowsMap.values());
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
      ].map((value) => (value ?? "").toString().toLowerCase());
      return tokens.some((value) => value.includes(term));
    });
  });

  const filasOrdenadas = computed(() => {
    const arr = [...filasFiltradas.value];
    return arr.sort((a, b) => {
      if (a.activityTs !== b.activityTs) return b.activityTs - a.activityTs;
      return b.id - a.id;
    });
  });

  const resumenHoy = computed(() => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().slice(0, 10);
    let total = 0;
    let metros = 0;

    for (const row of filasOrdenadas.value) {
      const fecha = row.fechaIngreso ?? row.dataInicial ?? row.ts ?? null;
      if (!fecha) continue;
      const fechaObj = new Date(fecha);
      if (Number.isNaN(fechaObj.getTime())) continue;
      const fechaStr = fechaObj.toISOString().slice(0, 10);
      if (fechaStr === hoyStr) {
        total += Number(row.valorPagado ?? 0) || 0;
        const metrosRow = Number(row.metros ?? 0);
        if (Number.isFinite(metrosRow)) metros += metrosRow;
      }
    }

    return { total, metros };
  });

  // Filas de HOY para gráficos (usa fechaIngreso o ts, en horario local)
  const todaysRowsForCharts = computed(() => {
    const hoy = new Date();
    const hoyLocal = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');

    const rows = filasOrdenadas.value;
    const out = [];
    const debugFechas = [];
    for (const row of rows) {
      const fecha = row.dataInicial ?? row.fechaIngreso ?? null;
      if (!fecha) continue;
      // Convertir dataInicial a fecha local y comparar solo YYYY-MM-DD
      const d = new Date(fecha);
      if (Number.isNaN(d.getTime())) continue;
      const fechaLocal = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      debugFechas.push({ raw: fecha, fechaLocal });
      if (fechaLocal === hoyLocal) out.push(row);
    }
    console.log('[DEBUG] hoyLocal:', hoyLocal);
    console.log('[DEBUG] dataInicial de todas las filas (primeros 5):', debugFechas.slice(0, 5));
    console.log('[DEBUG] Filas encontradas para hoy:', out.length, out.map(r => r.status));
    return out;
  });

  const statsToday = computed(() => {
    const rows = todaysRowsForCharts.value;
    // DEBUG: Mostrar agrupación de estados
    setTimeout(() => {
      try {
        const estados = [];
        for (const row of rows) {
          estados.push(row.status || 'Sin estado');
        }
        // Mostrar todos los estados de las órdenes de hoy
        console.log('[DEBUG] Estados de las órdenes de hoy:', estados);
      } catch (e) { console.warn('[DEBUG] Error mostrando estados', e); }
    }, 1000);
    const totalOrdenes = rows.length;
    let totalFacturado = 0;
    let totalPagado = 0;
    let totalPendiente = 0;
    let totalMetros = 0;
    let ordenesConMetros = 0;
    const estadoCount = new Map();
    const pagoCount = new Map();
    const claseCount = new Map();

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

      const claseLabel = (row.clase || "Sin clasificar").trim() || "Sin clasificar";
      claseCount.set(claseLabel, (claseCount.get(claseLabel) ?? 0) + 1);
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
      claseCount,
    };
  });

  const estadoChartDataToday = computed(() => {
    const total = statsToday.value.totalOrdenes || 1;
    const palette = ["#38bdf8", "#a855f7", "#f97316", "#22c55e", "#facc15", "#ef4444", "#14b8a6"];
    let index = 0;
    return Array.from(statsToday.value.estadoCount.entries())
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

  const pagoChartDataToday = computed(() => {
    const total = statsToday.value.totalOrdenes || 1;
    const palette = ["#22c55e", "#38bdf8", "#f97316", "#facc15", "#a855f7", "#ef4444"];
    let index = 0;
    return Array.from(statsToday.value.pagoCount.entries())
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

  const claseChartDataToday = computed(() => {
    const total = statsToday.value.totalOrdenes || 1;
    const palette = ["#14b8a6", "#8b5cf6", "#f59e0b", "#ec4899", "#06b6d4", "#84cc16"];
    let index = 0;
    return Array.from(statsToday.value.claseCount.entries())
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

  const visibleRows = computed(() => {
    if (!visibleCount.value) return filasOrdenadas.value.slice(0, chunkSize);
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

  const estadoPieSegmentsToday = computed(() => {
    const circumference = 2 * Math.PI * 42;
    const total = statsToday.value.totalOrdenes || 0;
    if (!total) return [];

    let offset = 0;
    return estadoChartDataToday.value.map((item) => {
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

  function loadMoreRows() {
    const total = filasOrdenadas.value.length;
    if (visibleCount.value < total) {
      visibleCount.value = Math.min(visibleCount.value + chunkSize, total);
    }
  }

  onMounted(async () => {
    console.info("[OrdersLive] Composable montado");
    await cargarAPI();
    conectarSSE();
    startTicker();
  });

  onBeforeUnmount(() => {
    stopRealtime();
  });

  // Reset pagination whenever the search term changes so users always start from the first page of results.
  watch(query, () => {
    visibleCount.value = chunkSize;
  });

  watch(
    () => filasFiltradas.value.length,
    (len) => {
      if (len < chunkSize) {
        visibleCount.value = len;
      } else if (visibleCount.value > len) {
        visibleCount.value = len;
      }
    }
  );

  return {
    estado,
    apiStatus,
    sseStatus,
    alertsCount,
    formattedAlerts,
    estadoColors: ESTADO_COLORS,
    pagoColors: PAGO_COLORS,
    q: query,
    resumenHoy,
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
    resumenPagos,
    fetchPaymentsSummary,
    estadoChartDataToday,
    pagoChartDataToday,
    claseChartDataToday,
    estadoPieSegmentsToday,
    statsToday,
  };
}
