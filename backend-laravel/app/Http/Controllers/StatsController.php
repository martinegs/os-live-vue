<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controlador de estadísticas operativas
 */
class StatsController extends Controller
{
    /**
     * GET /api/stats/metros-por-usuario?date=YYYY-MM-DD
     * Metros vendidos por usuario en el mes de la fecha
     */
    public function metrosPorUsuario(Request $request)
    {
        try {
            $targetDate = $request->query('date', date('Y-m-d'));
            
            // Obtener primer y último día del mes
            $date = new \DateTime($targetDate);
            $firstDay = $date->format('Y-m-01');
            $lastDay = $date->format('Y-m-t');
            
            $results = DB::select("
                SELECT 
                    u.nome AS usuario,
                    COALESCE(SUM(CAST(o.metros AS DECIMAL(15,2))), 0) AS total_metros
                FROM usuarios u
                LEFT JOIN os o ON u.idUsuarios = o.usuarios_id
                    AND o.dataInicial >= ?
                    AND o.dataInicial <= ?
                    AND o.metros IS NOT NULL
                    AND o.metros != ''
                WHERE u.idUsuarios IS NOT NULL
                GROUP BY u.idUsuarios, u.nome
                HAVING total_metros > 0
                ORDER BY total_metros DESC
            ", [$firstDay, $lastDay]);
            
            $data = [];
            foreach ($results as $row) {
                $data[] = [
                    'usuario' => $row->usuario,
                    'metros' => (float)$row->total_metros,
                ];
            }
            
            return response()->json([
                'date' => $targetDate,
                'month' => $date->format('Y-m'),
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            Log::error('[stats] Error fetching metros por usuario', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener datos'], 500);
        }
    }
}
