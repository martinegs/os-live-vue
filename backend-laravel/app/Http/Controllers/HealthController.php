<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Controlador de health check para monitoreo.
 * Migrado desde server/routes/health.js
 */
class HealthController extends Controller
{
    /**
     * GET /api/health
     * Health check con verificación de base de datos
     */
    public function index()
    {
        try {
            // Intentar ping a la base de datos
            DB::connection()->getPdo();
            
            // Leer versión desde composer.json
            $composerPath = base_path('composer.json');
            $version = '1.0.0';
            $name = 'digitaltex-laravel';
            
            if (file_exists($composerPath)) {
                $composer = json_decode(file_get_contents($composerPath), true);
                $name = $composer['name'] ?? $name;
                $version = $composer['version'] ?? $version;
            }
            
            return response()->json([
                'status' => 'ok',
                'name' => $name,
                'version' => $version,
                'database' => config('database.connections.mysql.database'),
                'uptime' => $this->getUptime(),
            ]);
        } catch (\Exception $e) {
            Log::error('[health] DB error', ['error' => $e->getMessage()]);
            return response()->json([
                'status' => 'error',
                'message' => 'DB no disponible'
            ], 503);
        }
    }
    
    /**
     * Calcula el uptime de la aplicación
     */
    private function getUptime()
    {
        // En Laravel no hay equivalente directo a process.uptime()
        // Retornamos el tiempo desde el inicio de la request
        $startFile = storage_path('framework/down');
        
        if (file_exists($startFile)) {
            return 0;
        }
        
        // Aproximación usando logs
        $logFile = storage_path('logs/laravel.log');
        if (file_exists($logFile)) {
            $fileTime = filemtime($logFile);
            return time() - $fileTime;
        }
        
        return 0;
    }
}
