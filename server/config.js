import dotenv from "dotenv";

dotenv.config();

/**
 * Configuracion centralizada del servidor.
 * Se asegura de sanear valores provenientes de variables de entorno.
 */

function toNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function sanitizeTableName(candidate, fallback) {
  const sanitized = (candidate || fallback || "").replace(/[^\w]/g, "");
  return sanitized || fallback;
}

function parseCsvList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = Object.freeze({
  env: process.env.NODE_ENV || "development",
  server: {
    port: toNumber(process.env.PORT, 4000),
    bodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
  },
  cors: {
    allowedOrigins: parseCsvList(
      process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173"
    ),
  },
  database: {
    host: process.env.MYSQL_HOST || "srv1526.hstgr.io",
    user: process.env.MYSQL_USER || "u371726528_dtex",
    password: process.env.MYSQL_PASSWORD || "@hnc|I*]GN0",
    database: process.env.MYSQL_DATABASE || "u371726528_dtex",
    charset: process.env.MYSQL_CHARSET || "utf8mb4",
    waitForConnections: true,
    connectionLimit: toNumber(process.env.MYSQL_POOL_LIMIT, 10),
    namedPlaceholders: true,
  },
  tables: {
    orders: sanitizeTableName(process.env.MYSQL_ORDERS_TABLE, "os"),
  },
  sse: {
    pingInterval: toNumber(process.env.SSE_PING_INTERVAL_MS, 25000),
  },
  eventBus: {
    table: sanitizeTableName(process.env.EVENT_BUS_TABLE, "event_bus"),
    pollInterval: toNumber(process.env.EVENT_BUS_POLL_INTERVAL_MS, 600),
    batchLimit: toNumber(process.env.EVENT_BUS_BATCH_LIMIT, 200),
  },
  activityTsColumn: (process.env.MYSQL_ACTIVITY_TS_COLUMN || "").trim() || null,
});
