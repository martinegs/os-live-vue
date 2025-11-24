<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controlador de resúmenes de lançamentos (movimientos).
 * Migrado desde server/routes/lancamentos.js y server/services/lancamentosService.js
 */
class LancamentoController extends Controller
{
    /**
     * GET /api/lancamentos/summary?date=YYYY-MM-DD
     * Obtiene resumen de lançamentos del día
     */
    public function summary(Request $request)
    {
        try {
            $dateQuery = $request->query('date', '');
            
            if (!empty($dateQuery) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateQuery)) {
                return response()->json([
                    'error' => 'Formato inválido, use YYYY-MM-DD'
                ], 400);
            }
            
            $targetDate = !empty($dateQuery) ? $dateQuery : date('Y-m-d');
            
            // Total general
            $totalRow = DB::selectOne("
                SELECT
                    COUNT(*) AS operaciones,
                    COALESCE(
                        SUM(
                            CASE 
                                WHEN tipo = 'Gasto' THEN -CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
                                ELSE CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
                            END
                        ), 0
                    ) AS totalNeto
                FROM lancamentos
                WHERE data_pagamento = ?
            ", [$targetDate]);
            
            // Por forma de pago
            $byPaymentMethod = DB::select("
                SELECT
                    forma_pgto,
                    COALESCE(SUM(
                        CASE 
                            WHEN tipo = 'Gasto' THEN -CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
                            ELSE CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))
                        END
                    ), 0) AS total
                FROM lancamentos
                WHERE data_pagamento = ?
                    AND (tipo = 'Venta' OR tipo = 'Adelanto' OR tipo = 'Gasto')
                GROUP BY forma_pgto
            ", [$targetDate]);
            
            // Por tipo
            $byType = DB::select("
                SELECT
                    tipo,
                    COUNT(*) AS cantidad,
                    COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))), 0) AS total
                FROM lancamentos
                WHERE data_pagamento = ?
                GROUP BY tipo
            ", [$targetDate]);
            
            // Detalle por forma de pago y tipo
            $detailed = DB::select("
                SELECT
                    forma_pgto,
                    tipo,
                    COALESCE(SUM(CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2))), 0) AS total
                FROM lancamentos
                WHERE data_pagamento = ?
                GROUP BY forma_pgto, tipo
            ", [$targetDate]);
            
            // Agrupar por forma de pago
            $paymentMethods = [
                'mercadoPago' => 0,
                'efectivo' => 0,
                'cheque' => 0,
            ];
            
            foreach ($byPaymentMethod as $row) {
                $method = strtolower($row->forma_pgto ?? '');
                $total = (float)$row->total;
                
                if (strpos($method, 'mercado') !== false || strpos($method, 'mp') !== false) {
                    $paymentMethods['mercadoPago'] += $total;
                } elseif (strpos($method, 'efectivo') !== false) {
                    $paymentMethods['efectivo'] += $total;
                } elseif (strpos($method, 'cheque') !== false) {
                    $paymentMethods['cheque'] += $total;
                }
            }
            
            // Agrupar detalles por forma de pago
            $paymentMethodDetails = [
                'mercadoPago' => ['entradas' => 0, 'salidas' => 0],
                'efectivo' => ['entradas' => 0, 'salidas' => 0],
                'cheque' => ['entradas' => 0, 'salidas' => 0],
            ];
            
            foreach ($detailed as $row) {
                $method = strtolower($row->forma_pgto ?? '');
                $tipo = $row->tipo ?? '';
                $total = (float)$row->total;
                
                $key = null;
                if (strpos($method, 'mercado') !== false || strpos($method, 'mp') !== false) {
                    $key = 'mercadoPago';
                } elseif (strpos($method, 'efectivo') !== false) {
                    $key = 'efectivo';
                } elseif (strpos($method, 'cheque') !== false) {
                    $key = 'cheque';
                }
                
                if ($key) {
                    if ($tipo === 'Gasto') {
                        $paymentMethodDetails[$key]['salidas'] += $total;
                    } else {
                        $paymentMethodDetails[$key]['entradas'] += $total;
                    }
                }
            }
            
            // Agrupar por tipo
            $types = [];
            foreach ($byType as $row) {
                $types[$row->tipo] = [
                    'cantidad' => (int)$row->cantidad,
                    'total' => (float)$row->total,
                ];
            }
            
            return response()->json([
                'date' => $targetDate,
                'operaciones' => (int)$totalRow->operaciones,
                'totalNeto' => (float)$totalRow->totalNeto,
                'byPaymentMethod' => $paymentMethods,
                'byPaymentMethodDetails' => $paymentMethodDetails,
                'byType' => $types,
            ]);
        } catch (\Exception $e) {
            Log::error('[lancamentos] Error fetching summary', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener resumen'], 500);
        }
    }

    /**
     * GET /api/lancamentos/realizadas?date=YYYY-MM-DD
     * Ventas vs Gastos realizados (pagados)
     */
    public function realizadas(Request $request)
    {
        try {
            $targetDate = $request->query('date', date('Y-m-d'));
            
            $result = DB::selectOne("
                SELECT 
                    COALESCE(SUM(CASE WHEN tipo = 'Venta' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS total_receita,
                    COALESCE(SUM(CASE WHEN tipo = 'Gasto' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS total_despesa
                FROM lancamentos
                WHERE data_pagamento IS NOT NULL 
                    AND data_pagamento <= ?
            ", [$targetDate]);
            
            return response()->json([
                'date' => $targetDate,
                'ventas' => (float)$result->total_receita,
                'gastos' => (float)$result->total_despesa,
            ]);
        } catch (\Exception $e) {
            Log::error('[lancamentos] Error fetching realizadas', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener datos'], 500);
        }
    }

    /**
     * GET /api/lancamentos/pendientes?date=YYYY-MM-DD
     * Ventas vs Gastos pendientes (no pagados)
     */
    public function pendientes(Request $request)
    {
        try {
            $targetDate = $request->query('date', date('Y-m-d'));
            
            $result = DB::selectOne("
                SELECT 
                    COALESCE(SUM(CASE WHEN tipo = 'Venta' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS total_receita_pendente,
                    COALESCE(SUM(CASE WHEN tipo = 'Gasto' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS total_despesa_pendente
                FROM lancamentos
                WHERE (data_pagamento IS NULL OR data_pagamento > ?)
            ", [$targetDate]);
            
            return response()->json([
                'date' => $targetDate,
                'ventas' => (float)$result->total_receita_pendente,
                'gastos' => (float)$result->total_despesa_pendente,
            ]);
        } catch (\Exception $e) {
            Log::error('[lancamentos] Error fetching pendientes', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener datos'], 500);
        }
    }

    /**
     * GET /api/lancamentos/prevision?date=YYYY-MM-DD
     * Total en caja previsto
     */
    public function prevision(Request $request)
    {
        try {
            $targetDate = $request->query('date', date('Y-m-d'));
            
            // Realizadas hasta la fecha
            $realizadas = DB::selectOne("
                SELECT 
                    COALESCE(SUM(CASE WHEN tipo = 'Venta' OR tipo = 'Adelanto' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS ingresos,
                    COALESCE(SUM(CASE WHEN tipo = 'Gasto' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS gastos
                FROM lancamentos
                WHERE data_pagamento IS NOT NULL 
                    AND data_pagamento <= ?
            ", [$targetDate]);
            
            // Pendientes después de la fecha
            $pendientes = DB::selectOne("
                SELECT 
                    COALESCE(SUM(CASE WHEN tipo = 'Venta' OR tipo = 'Adelanto' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS ingresos,
                    COALESCE(SUM(CASE WHEN tipo = 'Gasto' THEN CAST(REPLACE(valor, ',', '.') AS DECIMAL(15,2)) ELSE 0 END), 0) AS gastos
                FROM lancamentos
                WHERE (data_pagamento IS NULL OR data_pagamento > ?)
            ", [$targetDate]);
            
            $saldoActual = (float)$realizadas->ingresos - (float)$realizadas->gastos;
            $saldoFuturo = $saldoActual + (float)$pendientes->ingresos - (float)$pendientes->gastos;
            
            return response()->json([
                'date' => $targetDate,
                'enCajaAhora' => $saldoActual,
                'aEntrar' => $saldoFuturo,
            ]);
        } catch (\Exception $e) {
            Log::error('[lancamentos] Error fetching prevision', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener datos'], 500);
        }
    }
}

