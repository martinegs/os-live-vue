import express from "express";
import { createLancamentosService } from "../services/lancamentosService.js";

/**
 * Router HTTP para exponer resúmenes de recaudación desde la tabla de lancamentos.
 */
export function createLancamentosRouter({ pool, lancamentosTable }) {
  const router = express.Router();
  const lancamentosService = createLancamentosService({ pool, lancamentosTable });

  // GET /api/lancamentos/summary?date=YYYY-MM-DD
  router.get("/summary", async (req, res, next) => {
    try {
      const raw = typeof req.query.date === "string" ? req.query.date.trim() : "";
      if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        return res
          .status(400)
          .json({ error: "Formato inválido, use YYYY-MM-DD" });
      }

      const summary = await lancamentosService.fetchDailySummary(raw || undefined);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
