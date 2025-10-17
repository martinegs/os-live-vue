/**
 * Servicio para obtener resúmenes de pagos diarios segmentados por origen.
 *
 * Incluye una derivación especial para Mercado Pago que considera el monto
 * efectivamente registrado en las órdenes vinculadas.
 */

function formatLocalDate(date = new Date()) {
  // Ajusta a medianoche local para evitar desfasajes UTC al formatear.
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localMidnight = new Date(date.getTime() - tzOffsetMs);
  return localMidnight.toISOString().slice(0, 10);
}

export function createPaymentService({
  pool,
  paymentsTable,
  ordersTable,
  orderPaymentsTable,
}) {
  if (!paymentsTable) {
    throw new Error("paymentsTable es requerido para PaymentService");
  }
  if (!ordersTable) {
    throw new Error("ordersTable es requerido para PaymentService");
  }
  if (!orderPaymentsTable) {
    throw new Error("orderPaymentsTable es requerido para PaymentService");
  }

  async function fetchMpOrdersSummary(targetDate = formatLocalDate()) {

    const sql = `
      SELECT
        pagos.idPago AS idPago,
        pagos.fecha AS fecha,
        rel.os_id AS osId,
        COALESCE(os.valorPagado, 0) AS valorPagado
      FROM \`${paymentsTable}\` pagos
      INNER JOIN \`${orderPaymentsTable}\` rel ON rel.pagos_id = pagos.idPago
      INNER JOIN \`${ordersTable}\` os ON os.idOs = rel.os_id
      WHERE pagos.cargadoDesde = 'MP'
        AND pagos.fecha = ?
    `;
    console.log('[fetchMpOrdersSummary] SQL:', sql);
    console.log('[fetchMpOrdersSummary] Params:', targetDate);
    const [rows] = await pool.query(sql, [targetDate]);
    console.log('[fetchMpOrdersSummary] Result rows:', rows);

    const detalles = rows.map((row) => ({
      idPago: Number(row.idPago) || 0,
      fecha: row.fecha,
      osId: Number(row.osId) || 0,
      valorPagado: Number(row.valorPagado) || 0,
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
    console.log('[fetchTodaySummary] SQL:', sql);
    console.log('[fetchTodaySummary] Params:', targetDate);
    const [rows] = await pool.query(sql, [targetDate]);
    console.log('[fetchTodaySummary] Result rows:', rows);
    const mpSummary = await fetchMpOrdersSummary(targetDate);

    const normalized = rows.map((row) => {
      const origen = String(row.cargadoDesde || "").trim() || "Desconocido";
      let key;
      switch (origen) {
        case "MP":
          key = "mp";
          break;
        case "Adelanto":
          key = "adelanto";
          break;
        case "Área Clientes":
          key = "area_clientes";
          break;
        default:
          key = "desconocido";
          break;
      }
      return {
        origen,
        key,
        operaciones: Number(row.operaciones) || 0,
        totalBruto: Number(row.totalBruto) || 0,
        totalDescuento: Number(row.totalDescuento) || 0,
        totalNeto: Number(row.totalNeto) || 0,
      };
    });

    if (mpSummary.operaciones > 0) {
      let mpItem = normalized.find((item) => item.key === "mp");
      if (!mpItem) {
        mpItem = {
          origen: "MP",
          key: "mp",
          operaciones: 0,
          totalBruto: 0,
          totalDescuento: 0,
          totalNeto: 0,
        };
        normalized.push(mpItem);
      }
      mpItem.operaciones = mpSummary.operaciones;
      mpItem.totalNeto = mpSummary.totalValorPagado;
      mpItem.totalDescuento = mpItem.totalDescuento ?? 0;
      mpItem.detalles = mpSummary.detalles;
      mpItem.totalValorPagado = mpSummary.totalValorPagado;
    }

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
      mpOrders: mpSummary,
    };
  }

  return {
    fetchTodaySummary,
    fetchMpOrdersSummary,
  };
}
