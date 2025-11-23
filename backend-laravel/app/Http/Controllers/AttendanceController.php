<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controlador de asistencia de usuarios.
 * Migrado desde server/routes/attendance.js y server/services/attendanceService.js
 */
class AttendanceController extends Controller
{
    /**
     * GET /api/attendance/daily?date=YYYY-MM-DD
     * Obtiene el estado de asistencia del día
     */
    public function daily(Request $request)
    {
        try {
            $date = $request->query('date');
            
            // Validar formato de fecha
            if ($date && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                return response()->json([
                    'error' => 'Formato de fecha inválido. Use YYYY-MM-DD'
                ], 400);
            }
            
            $targetDate = $date ?: date('Y-m-d');
            
            // Obtener usuarios con idAsistencias != 0
            $usuarios = DB::select("
                SELECT idUsuarios, nome, email, idAsistencias 
                FROM usuarios 
                WHERE idAsistencias IS NOT NULL AND idAsistencias != 0
                ORDER BY nome
            ");
            
            if (empty($usuarios)) {
                return response()->json([
                    'date' => $targetDate,
                    'totalUsuarios' => 0,
                    'presentes' => 0,
                    'ausentes' => 0,
                    'sinRegistro' => 0,
                    'usuarios' => [],
                ]);
            }
            
            // Obtener asistencias del día
            $idUsuariosList = array_map(fn($u) => $u->idAsistencias, $usuarios);
            $placeholders = implode(',', array_fill(0, count($idUsuariosList), '?'));
            
            $asistencias = DB::select("
                SELECT idUsuario, fecha, horaEntrada, horaSalida 
                FROM asistencias 
                WHERE idUsuario IN ($placeholders) AND DATE(fecha) = ?
            ", array_merge($idUsuariosList, [$targetDate]));
            
            // Crear mapa de asistencias
            $asistenciasMap = [];
            foreach ($asistencias as $asistencia) {
                $asistenciasMap[$asistencia->idUsuario] = [
                    'horaEntrada' => $asistencia->horaEntrada,
                    'horaSalida' => $asistencia->horaSalida,
                ];
            }
            
            // Combinar datos
            $result = [];
            foreach ($usuarios as $usuario) {
                $hasRecord = isset($asistenciasMap[$usuario->idAsistencias]);
                
                $result[] = [
                    'id' => $usuario->idUsuarios,
                    'nombre' => $usuario->nome,
                    'email' => $usuario->email,
                    'idAsistencias' => $usuario->idAsistencias,
                    'estado' => $hasRecord ? 'Presente' : 'Ausente',
                    'presente' => $hasRecord,
                    'horaEntrada' => $hasRecord ? $asistenciasMap[$usuario->idAsistencias]['horaEntrada'] : null,
                    'horaSalida' => $hasRecord ? $asistenciasMap[$usuario->idAsistencias]['horaSalida'] : null,
                ];
            }
            
            // Calcular totales
            $totalUsuarios = count($result);
            $presentes = count(array_filter($result, fn($u) => $u['estado'] === 'Presente'));
            $ausentes = count(array_filter($result, fn($u) => $u['estado'] === 'Ausente'));
            
            return response()->json([
                'date' => $targetDate,
                'totalUsuarios' => $totalUsuarios,
                'presentes' => $presentes,
                'ausentes' => $ausentes,
                'sinRegistro' => 0,
                'usuarios' => $result,
            ]);
        } catch (\Exception $e) {
            Log::error('[attendance] Error al obtener asistencias', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Error al obtener datos de asistencia'
            ], 500);
        }
    }
}
