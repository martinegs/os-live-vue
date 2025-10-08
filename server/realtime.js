import express from "express";

/**
 * Gestiona conexiones SSE para mantener sincronizada la UI.
 */
export function createRealtimeHub({
  allowedOrigins,
  pingInterval,
  pool,
  orderService,
  eventBusConfig = {},
}) {
  const router = express.Router();
  const clients = new Set();
  let pingTimer = null;

  const eventBusTable = eventBusConfig?.table || null;
  const eventBatchLimit = Math.max(eventBusConfig?.batchLimit || 200, 1);
  const pollInterval = Math.max(eventBusConfig?.pollInterval || 600, 200);

  function buildEvent(type, payload) {
    return `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  }

  function maybeAttachCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  function broadcast(type, payload) {
    const message = buildEvent(type, payload);
    for (const client of clients) {
      client.res.write(message);
    }
  }

  function ensureHeartbeat() {
    if (!clients.size && pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    if (clients.size && !pingTimer) {
      pingTimer = setInterval(() => broadcast("ping", { ts: Date.now() }), pingInterval);
    }
  }

  function parsePayload(raw) {
    if (raw === null || raw === undefined) return {};
    if (Buffer.isBuffer(raw)) {
      return parsePayload(raw.toString("utf8"));
    }
    if (typeof raw === "object") {
      try {
        return JSON.parse(JSON.stringify(raw));
      } catch {
        return raw;
      }
    }
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return {};
  }

  async function resolveStartingEventId(req, channel) {
    const fromParam = req.query.from;
    if (fromParam !== undefined && fromParam !== null) {
      const parsed = Number(fromParam);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }

    const headerId = req.headers["last-event-id"];
    if (headerId !== undefined) {
      const parsed = Number(headerId);
      if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    }

    if (!eventBusTable || !pool) return 0;

    try {
      const sql = `SELECT COALESCE(MAX(id), 0) AS maxId FROM \`${eventBusTable}\` WHERE channel = ?`;
      const [rows] = await pool.query(sql, [channel]);
      const row = Array.isArray(rows) ? rows[0] : undefined;
      const maxId = Number(row?.maxId ?? 0);
      return Number.isFinite(maxId) ? maxId : 0;
    } catch (error) {
      console.error("[SSE] Error obteniendo ultimo id de event_bus", error);
      return 0;
    }
  }

  async function fetchEvents(channel, lastId) {
    if (!eventBusTable || !pool) return [];
    try {
      const sql = `
        SELECT id, type, payload
        FROM \`${eventBusTable}\`
        WHERE channel = ? AND id > ?
        ORDER BY id ASC
        LIMIT ?
      `;
      const [rows] = await pool.query(sql, [channel, lastId, eventBatchLimit]);
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error("[SSE] Error consultando event_bus", error);
      return [];
    }
  }

  async function enrichPayload(event) {
    const payload = parsePayload(event.payload);
    if (!orderService?.fetchOrderById) {
      return payload;
    }

    const orderId =
      Number(payload?.id ?? payload?.idOs ?? payload?.order_id ?? payload?.payload?.id) || null;

    if (!Number.isFinite(orderId) || orderId <= 0) {
      return payload;
    }

    try {
      const order = await orderService.fetchOrderById(orderId);
      if (order) {
        return order;
      }
    } catch (error) {
      console.error("[SSE] Error enriqueciendo payload", error);
    }
    return payload;
  }

  function scheduleEventPolling(client) {
    if (!eventBusTable || !pool) return;

    const loop = async () => {
      if (client.closed) return;

      try {
        const events = await fetchEvents(client.channel, client.lastId);
        if (events.length === 0) {
          client.res.write(`: heartbeat ${Date.now()}\n\n`);
          if (typeof client.res.flush === "function") client.res.flush();
        } else {
          for (const event of events) {
            const data = await enrichPayload(event);
            const eventId = Number(event.id);
            const type = event.type || "message";
            if (Number.isFinite(eventId)) {
              client.lastId = eventId;
              client.res.write(`id: ${eventId}\n`);
            }
            client.res.write(`event: ${type}\n`);
            client.res.write(`data: ${JSON.stringify(data)}\n\n`);
            if (typeof client.res.flush === "function") client.res.flush();
          }
        }
      } catch (error) {
        console.error("[SSE] Error durante polling de eventos", error);
      } finally {
        if (!client.closed) {
          client.pollTimer = setTimeout(loop, pollInterval);
        }
      }
    };

    loop();
  }

  router.options("/stream", (req, res) => {
    maybeAttachCorsHeaders(req, res);
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendStatus(204);
  });

  router.get("/stream", async (req, res) => {
    try {
      const channel = (req.query.channel || "os").toString();

      maybeAttachCorsHeaders(req, res);

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate, no-transform",
        "X-Accel-Buffering": "no",
        "Content-Encoding": "identity",
        Connection: "keep-alive",
      });

      if (typeof res.flushHeaders === "function") {
        res.flushHeaders();
      }

      res.write("retry: 3000\n");
      res.write(buildEvent("ping", { ts: Date.now(), channel }));
      if (typeof res.flush === "function") {
        res.flush();
      } else {
        res.write(":\n\n");
      }

      const startingId = await resolveStartingEventId(req, channel);
      const client = {
        res,
        channel,
        lastId: startingId,
        pollTimer: null,
        closed: false,
      };

      clients.add(client);
      ensureHeartbeat();

      console.log(
        `[SSE] cliente conectado (canal=${channel}, desde=${startingId || 0})`
      );

      if (eventBusTable && pool) {
        scheduleEventPolling(client);
      }

      req.on("close", () => {
        client.closed = true;
        if (client.pollTimer) {
          clearTimeout(client.pollTimer);
        }
        clients.delete(client);
        ensureHeartbeat();
        console.log(`[SSE] cliente desconectado (canal=${channel})`);
      });
    } catch (error) {
      console.error("[SSE] Error iniciando stream", error);
      if (!res.headersSent) {
        res.status(500).end();
      } else {
        res.end();
      }
    }
  });

  function shutdown() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
    for (const client of clients) {
      client.closed = true;
      if (client.pollTimer) {
        clearTimeout(client.pollTimer);
      }
      client.res.end();
    }
    clients.clear();
  }

  return {
    router,
    broadcast,
    shutdown,
  };
}
