/**
 * Servicio para obtener resúmenes de pagos diarios segmentados por origen.
 */

function formatLocalDate(date = new Date()) {
  // Ajusta a medianoche local para evitar desfasajes UTC al formatear.
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localMidnight = new Date(date.getTime() - tzOffsetMs);
  return localMidnight.toISOString().slice(0, 10);
}

function normalizeOriginKey(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function createPaymentService({ pool, paymentsTable }) {
  if (!paymentsTable) {
    throw new Error("paymentsTable es requerido para PaymentService");
  }

  /**
   * Devuelve totales de pagos del día agrupados por `cargadoDesde`.
   */
  async function fetchTodaySummary(targetDate = formatLocalDate()) {
    const sql = `
      SELECT
        cargadoDesde,
        COUNT(*)           AS operaciones,
        COALESCE(SUM(pagoTotal), 0)     AS totalBruto,
        COALESCE(SUM(descuentoMP), 0)   AS totalDescuento,
        COALESCE(SUM(netoRecibido), 0)  AS totalNeto
      FROM \`${paymentsTable}\`
      WHERE fecha = ?
      GROUP BY cargadoDesde
    `;

    const [rows] = await pool.query(sql, [targetDate]);

    const normalized = rows.map((row) => {
      const origen = String(row.cargadoDesde || "").trim() || "Desconocido";
      const key = normalizeOriginKey(origen) || "desconocido";
      return {
        origen,
        key,
        operaciones: Number(row.operaciones) || 0,
        totalBruto: Number(row.totalBruto) || 0,
        totalDescuento: Number(row.totalDescuento) || 0,
        totalNeto: Number(row.totalNeto) || 0,
      };
    });

    const aggregate = normalized.reduce(
      (acc, item) => {
        acc.operaciones += item.operaciones;
        acc.totalBruto += item.totalBruto;
        acc.totalDescuento += item.totalDescuento;
        acc.totalNeto += item.totalNeto;
        return acc;
      },
      { operaciones: 0, totalBruto: 0, totalDescuento: 0, totalNeto: 0 }
    );

    return {
      date: targetDate,
      items: normalized,
      aggregate,
    };
  }

  return {
    fetchTodaySummary,
  };
}
