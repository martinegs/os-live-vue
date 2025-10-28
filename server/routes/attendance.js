import express from "express";

export function createAttendanceRouter(attendanceService) {
  const router = express.Router();

  /**
   * GET /api/attendance/daily?date=YYYY-MM-DD
   * Obtiene el estado de asistencia del día
   */
  router.get("/daily", async (req, res) => {
    try {
      const { date } = req.query;
      
      // Validar formato de fecha si se proporciona
      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: "Formato de fecha inválido. Use YYYY-MM-DD" });
      }

      const data = await attendanceService.fetchDailyAttendance(date);
      res.json(data);
    } catch (error) {
      console.error("[attendance] Error al obtener asistencias:", error);
      res.status(500).json({ error: "Error al obtener datos de asistencia" });
    }
  });

  return router;
}
