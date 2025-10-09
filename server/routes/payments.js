import express from "express";

/**
 * Router HTTP para exponer resúmenes de pagos diarios.
 */
export function createPaymentsRouter({ paymentService }) {
  if (!paymentService) {
    throw new Error("paymentService es requerido para PaymentsRouter");
  }

  const router = express.Router();

  router.get("/today", async (req, res, next) => {
    try {
      const dateQuery = typeof req.query.date === "string" ? req.query.date.trim() : "";
      const date =
        dateQuery && /^\d{4}-\d{2}-\d{2}$/.test(dateQuery) ? dateQuery : undefined;

      const summary = await paymentService.fetchTodaySummary(date);
      res.json(summary);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

