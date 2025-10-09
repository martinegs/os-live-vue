import express from "express";
import cors from "cors";
import { createRequire } from "node:module";

import { config } from "./config.js";
import { pool, verifyConnection } from "./db.js";
import { httpLogger } from "./middleware/logger.js";
import { createRealtimeHub } from "./realtime.js";
import { createOrderService } from "./services/orderService.js";
import { createPaymentService } from "./services/paymentService.js";
import { createOrdersRouter } from "./routes/orders.js";
import { createPaymentsRouter } from "./routes/payments.js";
import { createHealthRouter } from "./routes/health.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

/**
 * Punto de entrada HTTP principal.
 * Orquesta middlewares, rutas y ciclo de vida de DigitalTex Orders API.
 */

const app = express();
const allowedOrigins = config.cors.allowedOrigins;

app.disable("x-powered-by");
app.use(express.json({ limit: config.server.bodyLimit }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origen no permitido: ${origin}`));
    },
    credentials: true,
  })
);

const orderService = createOrderService({
  pool,
  ordersTable: config.tables.orders,
  activityTsColumn: config.activityTsColumn,
});
const paymentService = createPaymentService({
  pool,
  paymentsTable: config.tables.payments,
});

app.use(httpLogger());

const realtime = createRealtimeHub({
  allowedOrigins: config.cors.allowedOrigins,
  pingInterval: config.sse.pingInterval,
  pool,
  orderService,
  eventBusConfig: config.eventBus,
});

// Rutas ---------------------------------------------------------------
app.use(
  "/health",
  createHealthRouter({ pool, ordersTable: config.tables.orders, pkg })
);
app.use(
  "/api/os",
  createOrdersRouter({ orderService, broadcast: realtime.broadcast })
);
app.use(
  "/api/pagos",
  createPaymentsRouter({ paymentService })
);
app.use("/realtime", realtime.router);

// Manejador centralizado de errores -----------------------------------
app.use((err, _req, res, _next) => {
  console.error("[API] error", err);
  if (err?.message?.startsWith("Origen no permitido")) {
    return res.status(403).json({ message: err.message });
  }
  res.status(500).json({ message: err.message || "Error inesperado" });
});

// Lifecycle -----------------------------------------------------------
const server = app.listen(config.server.port, () => {
  console.log(`[Orders API] escuchando en http://localhost:${config.server.port}`);
});

verifyConnection();

async function shutdown(signal) {
  console.log(`[Lifecycle] Recibido ${signal}, cerrando servidor...`);

  realtime.shutdown();

  try {
    await pool.end();
  } catch (error) {
    console.error("[Lifecycle] Error al cerrar pool", error);
  }

  await new Promise((resolve) => server.close(resolve));
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("unhandledRejection", (error) => {
  console.error("[Lifecycle] Unhandled rejection", error);
});
