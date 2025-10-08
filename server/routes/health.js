import express from "express";

/**
 * Router de health-check para monitoreo y readiness probes.
 */
export function createHealthRouter({ pool, ordersTable, pkg }) {
  const router = express.Router();

  router.get("/", async (_req, res) => {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();

      res.json({
        status: "ok",
        name: pkg.name,
        version: pkg.version,
        database: ordersTable,
        uptime: process.uptime(),
      });
    } catch (error) {
      console.error("[health] DB error", error);
      res.status(503).json({ status: "error", message: "DB no disponible" });
    }
  });

  return router;
}

