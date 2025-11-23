<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controlador de resumen de pagos diarios.
 * Migrado desde server/routes/payments.js y server/services/paymentService.js
 */
class PaymentController extends Controller
{
    /**
     * GET /api/payments/today?date=YYYY-MM-DD
     * Obtiene resumen de pagos del día agrupados por origen
     */
    public function today(Request $request)
    {
        try {
            $dateQuery = $request->query('date', '');
            $targetDate = $this->validateDate($dateQuery) 
                ? $dateQuery 
                : date('Y-m-d');
            
            // Obtener totales agrupados por cargadoDesde
            $rows = DB::select("
                SELECT
                    cargadoDesde,
                    COUNT(*) AS operaciones,
                    COALESCE(SUM(pagoTotal), 0) AS totalBruto,
                    COALESCE(SUM(descuentoMP), 0) AS totalDescuento,
                    COALESCE(SUM(netoRecibido), 0) AS totalNeto
                FROM pagos
                WHERE fecha = ?
                GROUP BY cargadoDesde
            ", [$targetDate]);
            
            Log::info('[payments] fetchTodaySummary', [
                'date' => $targetDate,
                'rows' => count($rows)
            ]);
            
            // Obtener resumen especial de Mercado Pago
            $mpSummary = $this->fetchMpOrdersSummary($targetDate);
            
            // Normalizar resultados
            $summary = [
                'date' => $targetDate,
                'mp' => ['operaciones' => 0, 'totalNeto' => 0],
                'adelanto' => ['operaciones' => 0, 'totalNeto' => 0],
                'efectivo' => ['operaciones' => 0, 'totalNeto' => 0],
                'other' => ['operaciones' => 0, 'totalNeto' => 0],
            ];
            
            foreach ($rows as $row) {
                $origen = trim($row->cargadoDesde ?? '');
                $key = 'other';
                
                switch ($origen) {
                    case 'MP':
                        $key = 'mp';
                        break;
                    case 'Adelanto':
                        $key = 'adelanto';
                        break;
                    case 'Efectivo':
                        $key = 'efectivo';
                        break;
                }
                
                $summary[$key] = [
                    'operaciones' => (int)$row->operaciones,
                    'totalBruto' => (float)$row->totalBruto,
                    'totalDescuento' => (float)$row->totalDescuento,
                    'totalNeto' => (float)$row->totalNeto,
                ];
            }
            
            // Reemplazar datos de MP con el resumen especial
            if ($summary['mp']['operaciones'] > 0) {
                $summary['mp']['mpOrdersSummary'] = $mpSummary;
            }
            
            return response()->json($summary);
        } catch (\Exception $e) {
            Log::error('[payments] Error fetching summary', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener resumen de pagos'], 500);
        }
    }
    
    /**
     * Obtiene resumen especial de pagos de Mercado Pago
     * Considera el monto efectivamente registrado en las órdenes vinculadas
     */
    private function fetchMpOrdersSummary($targetDate)
    {
        $rows = DB::select("
            SELECT
                pagos.idPago AS idPago,
                pagos.fecha AS fecha,
                rel.os_id AS osId,
                COALESCE(os.valorPagado, 0) AS valorPagado
            FROM pagos
            INNER JOIN os_pagos rel ON rel.pagos_id = pagos.idPago
            INNER JOIN ordenes os ON os.idOs = rel.os_id
            WHERE pagos.cargadoDesde = 'MP'
                AND pagos.fecha = ?
        ", [$targetDate]);
        
        Log::info('[payments] fetchMpOrdersSummary', [
            'date' => $targetDate,
            'rows' => count($rows)
        ]);
        
        $detalles = [];
        $totalValorPagado = 0;
        
        foreach ($rows as $row) {
            $detalle = [
                'idPago' => (int)$row->idPago,
                'fecha' => $row->fecha,
                'osId' => (int)$row->osId,
                'valorPagado' => (float)$row->valorPagado,
            ];
            $detalles[] = $detalle;
            $totalValorPagado += $detalle['valorPagado'];
        }
        
        return [
            'date' => $targetDate,
            'totalValorPagado' => $totalValorPagado,
            'operaciones' => count($detalles),
            'detalles' => $detalles,
        ];
    }
    
    /**
     * Valida formato de fecha YYYY-MM-DD
     */
    private function validateDate($dateString)
    {
        return preg_match('/^\d{4}-\d{2}-\d{2}$/', trim($dateString));
    }
}
