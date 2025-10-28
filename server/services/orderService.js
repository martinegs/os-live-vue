/**
 * Servicio que encapsula toda la logica de acceso a ordenes.
 * Se mantiene libre de dependencias de Express para facilitar pruebas.
 */

const fieldMap = Object.freeze({
  status: "status",
  statusPago: "statusPago",
  valorTotal: "valorTotal",
  valorPagado: "valorPagado",
  pendiente: "pendiente",
  metros: "metros",
  senia: "senia",
  lugares_id: "lugares_id",
  fechaIngreso: "dataInicial",
  fechaEntrega: "dataFinal",
  trabajo: "garantia",
  descripcionProducto: "observacoes",
  clase: "defeito",
  informacionGeneral: "laudoTecnico",
  es_rehacer: "es_rehacer",
  esAreaClientes: "pagadoAreaClientes",
});

const numericKeys = new Set(["valorTotal", "valorPagado", "pendiente", "metros"]);
const booleanKeys = new Set(["es_rehacer", "esAreaClientes"]);

function sanitizeNumber(value, fallback = 0) {
  if (value === null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function toBooleanFlag(value) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "1" || normalized === "true" || normalized === "si") {
      return 1;
    }
    return 0;
  }
  if (typeof value === "number") {
    return Number(value) === 1 ? 1 : 0;
  }
  return value ? 1 : 0;
}

function formatLocalDate(date = new Date()) {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localMidnight = new Date(date.getTime() - tzOffsetMs);
  return localMidnight.toISOString().slice(0, 10);
}

function mapDbRow(row, activityTsColumn) {
  return {
    id: Number(row.id ?? row.idOs) || 0,
    status: row.status ?? null,
    statusPago: row.statusPago ?? null,
    valorTotal: sanitizeNumber(row.valorTotal, 0),
    valorPagado: sanitizeNumber(row.valorPagado, 0),
    pendiente: sanitizeNumber(row.pendiente, 0),
    metros: row.metros === null ? null : sanitizeNumber(row.metros, 0),
    senia: row.senia ?? null,
    lugares_id: row.lugares_id ?? null,
    ts: row.ts ?? null,
    cliente_id: row.cliente_id ?? row.clientes_id ?? null,
    cliente_nombre: row.cliente_nombre ?? null,
    area: row.area ?? null,
    usuario_id: row.usuario_id ?? row.usuarios_id ?? null,
    usuario_nombre: row.usuario_nombre ?? null,
    es_rehacer: Number(row.es_rehacer ?? 0),
    fechaIngreso: row.fechaIngreso ?? null,
    fechaEntrega: row.fechaEntrega ?? null,
    lugarEntrega: row.lugarEntrega ?? null,
    lugar: row.lugarEntrega ?? null,
    trabajo: row.trabajo ?? null,
    descripcionProducto: row.descripcionProducto ?? null,
    clase: row.clase ?? null,
    informacionGeneral: row.informacionGeneral ?? null,
    fechaPago: row.fechaPago ?? null,
    esAreaClientes: Boolean(
      Number(row.pagadoAreaClientes ?? row.esAreaClientes ?? 0)
    ),
    hayNOP: Boolean(Number(row.numeroOperacion ?? row.hayNOP ?? 0)),
    activityTs: activityTsColumn
      ? Number(row[activityTsColumn] ?? Date.now())
      : Date.now(),
  };
}

function normalizeOrderInput(input, prev, activityTsColumn) {
  const result = {};

  for (const [key, column] of Object.entries(fieldMap)) {
    if (key === "id") continue;
    let value = input?.[key];

    if (value === undefined) continue;
    if (typeof value === "string") {
      value = value.trim();
      if (value === "") value = null;
    }
    if (numericKeys.has(key)) {
      value = sanitizeNumber(value, sanitizeNumber(prev?.[key] ?? 0));
    }

    if (booleanKeys.has(key)) {
      value = toBooleanFlag(value);
    }

    if (key === "metros" && value === null) {
      result[column] = null;
      continue;
    }

    result[column] = value;
  }

  if (activityTsColumn) {
    result[activityTsColumn] = Date.now();
  }

  return result;
}

function selectFields() {
  return `
    os.idOs AS id,
    os.status AS status,
    os.statusPago AS statusPago,
    os.valorTotal AS valorTotal,
    os.valorPagado AS valorPagado,
    os.pendiente AS pendiente,
    os.metros AS metros,
    os.senia AS senia,
    os.lugares_id AS lugares_id,
    COALESCE(os.dataFinal, os.dataInicial) AS ts,
    os.dataInicial AS fechaIngreso,
    os.dataFinal AS fechaEntrega,
    os.garantia AS trabajo,
    os.observacoes AS descripcionProducto,
    os.defeito AS clase,
    os.laudoTecnico AS informacionGeneral,
    os.es_rehacer AS es_rehacer,
    os.pagadoAreaClientes AS pagadoAreaClientes,
    os.numeroOperacion AS numeroOperacion,
    os.clientes_id AS clientes_id,
    os.usuarios_id AS usuarios_id,
    clientes.areas_interes AS area,
    clientes.idClientes AS cliente_id,
    clientes.nomeCliente AS cliente_nombre,
    usuarios.idUsuarios AS usuario_id,
    usuarios.nome AS usuario_nombre,
    COALESCE(lugares_entrega.lugar, '') AS lugarEntrega,
    NULL AS fechaPago
  `;
}

export function createOrderService({
  pool,
  ordersTable,
  paymentsTable,
  orderPaymentsTable,
  activityTsColumn,
}) {
  async function fetchOrders(limit = null) {
    const limitClause = limit ? "LIMIT ?" : "";
    const sql = `
      SELECT
        ${selectFields()}
      FROM \`${ordersTable}\` os
      LEFT JOIN clientes ON clientes.idClientes = os.clientes_id
      LEFT JOIN usuarios ON usuarios.idUsuarios = os.usuarios_id
      LEFT JOIN lugares_entrega ON lugares_entrega.idLugar = os.lugares_id
      ORDER BY os.idOs DESC
      ${limitClause}
    `;
    const params = limit ? [limit] : [];
    const [rows] = await pool.query(sql, params);
    return rows.map((row) => mapDbRow(row, activityTsColumn));
  }

  async function fetchOrderById(id) {
    const sql = `
      SELECT
        ${selectFields()}
      FROM \`${ordersTable}\` os
      LEFT JOIN clientes ON clientes.idClientes = os.clientes_id
      LEFT JOIN usuarios ON usuarios.idUsuarios = os.usuarios_id
      LEFT JOIN lugares_entrega ON lugares_entrega.idLugar = os.lugares_id
      WHERE os.idOs = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows.length ? mapDbRow(rows[0], activityTsColumn) : null;
  }

  async function insertOrder(body) {
    const nowIso = new Date().toISOString();
    const seed = {
      status: body?.status ?? "Presupuesto",
      statusPago: body?.statusPago ?? "Pendiente",
      valorTotal: body?.valorTotal ?? 0,
      valorPagado: body?.valorPagado ?? 0,
      pendiente: body?.pendiente ?? (body?.valorTotal ?? 0) - (body?.valorPagado ?? 0),
      fechaIngreso: body?.fechaIngreso ?? nowIso.slice(0, 10),
    };

    const payload = normalizeOrderInput({ ...seed, ...body }, {}, activityTsColumn);

    const columns = Object.keys(payload);
    if (!columns.length) {
      throw new Error("Sin datos para crear la orden");
    }

    const placeholders = columns.map(() => "?").join(", ");
    const values = columns.map((key) => payload[key]);
    const columnList = columns.map((column) => `\`${column}\``).join(", ");
    const sql = `INSERT INTO \`${ordersTable}\` (${columnList}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, values);
    return fetchOrderById(result.insertId);
  }

  async function updateOrder(id, body) {
    const existing = await fetchOrderById(id);
    if (!existing) {
      return null;
    }

    const payload = normalizeOrderInput(body, existing, activityTsColumn);

    const columns = Object.keys(payload);
    if (!columns.length) {
      return existing;
    }

    const assignments = columns.map((column) => `\`${column}\` = ?`).join(", ");
    const values = columns.map((column) => payload[column]);
    const sql = `UPDATE \`${ordersTable}\` SET ${assignments} WHERE idOs = ?`;
    await pool.query(sql, [...values, id]);
    return fetchOrderById(id);
  }

  async function pagadoConMp(targetDate = formatLocalDate()) {
    if (!paymentsTable) {
      throw new Error("paymentsTable no configurada para pagadoConMp");
    }
    if (!orderPaymentsTable) {
      throw new Error("orderPaymentsTable no configurada para pagadoConMp");
    }

    const sql = `
      SELECT
        pagos.idPago AS idPago,
        pagos.fecha AS fecha,
        rel.os_id AS osId,
        os.valorPagado AS valorPagado
      FROM \`${paymentsTable}\` pagos
      INNER JOIN \`${orderPaymentsTable}\` rel ON rel.pagos_id = pagos.idPago
      INNER JOIN \`${ordersTable}\` os ON os.idOs = rel.os_id
      WHERE pagos.cargadoDesde = 'MP'
        AND pagos.fecha = ?
    `;
    const [rows] = await pool.query(sql, [targetDate]);

    const detalles = rows.map((row) => ({
      idPago: Number(row.idPago) || 0,
      fecha: row.fecha,
      osId: Number(row.osId) || 0,
      valorPagado: sanitizeNumber(row.valorPagado, 0) ?? 0,
    }));

    const totalValorPagado = detalles.reduce(
      (acc, item) => acc + item.valorPagado,
      0
    );

    return {
      date: targetDate,
      totalValorPagado,
      operaciones: detalles.length,
      detalles,
    };
  }

  return {
    fetchOrders,
    fetchOrderById,
    insertOrder,
    updateOrder,
    pagadoConMp,
  };
}
