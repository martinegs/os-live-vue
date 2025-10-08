import express from "express";

/**
 * Router HTTP para operaciones sobre Ordenes.
 */
export function createOrdersRouter({ orderService, broadcast }) {
  const router = express.Router();

  // Lista ordenes, con limite opcional para vistas rapidas.
  router.get("/", async (req, res, next) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : null;
      const orders = await orderService.fetchOrders(limit);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  });

  // Crea una nueva orden y notifica a los clientes SSE.
  router.post("/create", async (req, res, next) => {
    try {
      const created = await orderService.insertOrder(req.body || {});
      broadcast("insert", created);
      res.status(201).json({ result: true, id: created.id, order: created });
    } catch (error) {
      next(error);
    }
  });

  // Actualiza una orden existente y sincroniza via SSE.
  router.put("/update", async (req, res, next) => {
    try {
      const id = Number(req.body?.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ result: false, message: "ID invalido" });
      }

      const updated = await orderService.updateOrder(id, req.body || {});
      if (!updated) {
        return res
          .status(404)
          .json({ result: false, message: "Orden no encontrada" });
      }

      broadcast("update", updated);
      res.json({ result: true, order: updated });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

