/**
 * Servicio para obtener resúmenes de recaudación desde la tabla lancamentos.
 * Filtra lanzamientos de tipo Venta con pago confirmado.
 */

function formatLocalDate(date = new Date()) {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localMidnight = new Date(date.getTime() - tzOffsetMs);
  return localMidnight.toISOString().slice(0, 10);
}

export function createLancamentosService({ pool, lancamentosTable = "lancamentos" }) {
  /**
   * Devuelve el total de ventas cobradas para una fecha dada.
   * @param {string} targetDate - Fecha en formato YYYY-MM-DD
   * @returns {Promise<{date: string, operaciones: number, totalNeto: number}>}
   */
  async function fetchDailySummary(targetDate = formatLocalDate()) {
    const sql = `
      SELECT
        COUNT(*) AS operaciones,
        COALESCE(
          SUM(
            CASE 
              WHEN tipo = 'Gasto' THEN -CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
              ELSE CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
            END
          ), 0
        ) AS totalNeto
      FROM \`${lancamentosTable}\`
      WHERE data_pagamento = ?
    `;

    const sqlByPaymentMethod = `
      SELECT
        forma_pgto,
        COALESCE(SUM(
          CASE 
            WHEN tipo = 'Gasto' THEN -CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
            ELSE CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
          END
        ), 0) AS total
      FROM \`${lancamentosTable}\`
      WHERE data_pagamento = ?
        AND (tipo = 'Venta' OR tipo = 'Adelanto' OR tipo = 'Gasto')
      GROUP BY forma_pgto
    `;

    const sqlByType = `
      SELECT
        tipo,
        COUNT(*) AS cantidad,
        COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))), 0) AS total
      FROM \`${lancamentosTable}\`
      WHERE data_pagamento = ?
      GROUP BY tipo
    `;

    const sqlByPaymentMethodDetailed = `
      SELECT
        forma_pgto,
        tipo,
        COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))), 0) AS total
      FROM \`${lancamentosTable}\`
      WHERE data_pagamento = ?
      GROUP BY forma_pgto, tipo
    `;

    const [rows] = await pool.query(sql, [targetDate]);
    const [paymentMethodRows] = await pool.query(sqlByPaymentMethod, [targetDate]);
    const [typeRows] = await pool.query(sqlByType, [targetDate]);
    const [paymentMethodDetailedRows] = await pool.query(sqlByPaymentMethodDetailed, [targetDate]);
    
    const row = rows[0] || {};
    
    // Agrupar por forma de pago
    const byPaymentMethod = {
      mercadoPago: 0,
      efectivo: 0,
      cheque: 0,
    };

    paymentMethodRows.forEach((pmRow) => {
      const method = String(pmRow.forma_pgto || '').toLowerCase();
      const total = Number(pmRow.total || 0);
      
      if (method.includes('mercado') || method.includes('mp')) {
        byPaymentMethod.mercadoPago += total;
      } else if (method.includes('efectivo')) {
        byPaymentMethod.efectivo += total;
      } else if (method.includes('cheque')) {
        byPaymentMethod.cheque += total;
      }
    });

    // Agrupar detalles por forma de pago (entradas y salidas)
    const byPaymentMethodDetails = {
      mercadoPago: { entradas: 0, salidas: 0 },
      efectivo: { entradas: 0, salidas: 0 },
      cheque: { entradas: 0, salidas: 0 },
    };

    paymentMethodDetailedRows.forEach((pmRow) => {
      const method = String(pmRow.forma_pgto || '').toLowerCase();
      const tipo = String(pmRow.tipo || '').toLowerCase();
      const total = Number(pmRow.total || 0);
      
      let targetMethod = null;
      if (method.includes('mercado') || method.includes('mp')) {
        targetMethod = 'mercadoPago';
      } else if (method.includes('efectivo')) {
        targetMethod = 'efectivo';
      } else if (method.includes('cheque')) {
        targetMethod = 'cheque';
      }

      if (targetMethod) {
        if (tipo === 'gasto') {
          byPaymentMethodDetails[targetMethod].salidas += total;
        } else if (tipo === 'venta' || tipo === 'adelanto') {
          byPaymentMethodDetails[targetMethod].entradas += total;
        }
      }
    });

    // Agrupar por tipo
    const byType = {
      venta: { cantidad: 0, total: 0 },
      adelanto: { cantidad: 0, total: 0 },
      gasto: { cantidad: 0, total: 0 },
    };

    typeRows.forEach((typeRow) => {
      const tipo = String(typeRow.tipo || '').toLowerCase();
      const cantidad = Number(typeRow.cantidad || 0);
      const total = Number(typeRow.total || 0);
      
      if (tipo === 'venta') {
        byType.venta = { cantidad, total };
      } else if (tipo === 'adelanto') {
        byType.adelanto = { cantidad, total };
      } else if (tipo === 'gasto') {
        byType.gasto = { cantidad, total };
      }
    });

    return {
      date: targetDate,
      operaciones: Number(row.operaciones || 0),
      totalNeto: Number(row.totalNeto || 0),
      byPaymentMethod,
      byPaymentMethodDetails,
      byType,
    };
  }

  return {
    fetchDailySummary,
  };
}
