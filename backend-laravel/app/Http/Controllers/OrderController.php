<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Services\RealtimeService;

/**
 * Controlador de gestión de órdenes de servicio.
 * Migrado desde server/routes/orders.js y server/services/orderService.js
 */
class OrderController extends Controller
{
    private $realtimeService;
    
    public function __construct(RealtimeService $realtimeService)
    {
        $this->realtimeService = $realtimeService;
    }
    
    /**
     * GET /api/orders
     * Lista órdenes con límite opcional y filtro de fecha
     */
    public function index(Request $request)
    {
        try {
            $limit = $request->query('limit', 1000);
            $limit = is_numeric($limit) ? (int)$limit : 1000;
            
            // Parámetros opcionales de fecha
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            
            // Log para debug
            Log::info('[orders] Request params', [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'limit' => $limit
            ]);
            
            $query = DB::table('os as os')
                ->leftJoin('clientes as c', 'os.clientes_id', '=', 'c.idClientes')
                ->leftJoin('usuarios as u', 'os.usuarios_id', '=', 'u.idUsuarios')
                ->leftJoin('lugares_entrega as le', 'le.idLugar', '=', 'os.lugares_id')
                ->select([
                    'os.idOs as id',
                    'os.status',
                    'os.statusPago',
                    'os.valorTotal',
                    'os.valorPagado',
                    'os.pendiente',
                    'os.metros',
                    'os.senia',
                    'os.lugares_id',
                    DB::raw('COALESCE(os.dataFinal, os.dataInicial) as ts'),
                    'os.clientes_id as cliente_id',
                    'c.nomeCliente as cliente_nombre',
                    'c.areas_interes as area',
                    'os.usuarios_id as usuario_id',
                    'u.nome as usuario_nombre',
                    'os.es_rehacer',
                    'os.dataInicial as fechaIngreso',
                    'os.dataFinal as fechaEntrega',
                    DB::raw('COALESCE(le.lugar, "") as lugarEntrega'),
                    'os.garantia as trabajo',
                    'os.observacoes as descripcionProducto',
                    'os.defeito as clase',
                    'os.laudoTecnico as informacionGeneral',
                    DB::raw('NULL as fechaPago'),
                    'os.pagadoAreaClientes as esAreaClientes',
                    'os.numeroOperacion',
                    DB::raw('CASE WHEN os.numeroOperacion IS NOT NULL AND os.numeroOperacion != "" THEN 1 ELSE 0 END as hayNOP')
                ]);
            
            // Aplicar filtro de fechas si se proporciona
            if ($startDate) {
                Log::info('[orders] Adding start_date filter', ['date' => $startDate]);
                $query->where('os.dataInicial', '>=', $startDate);
            }
            if ($endDate) {
                $endDateFull = $endDate . ' 23:59:59';
                Log::info('[orders] Adding end_date filter', ['date' => $endDateFull]);
                $query->where('os.dataInicial', '<=', $endDateFull);
            }
            
            // Log SQL query before execution
            $sql = $query->toSql();
            $bindings = $query->getBindings();
            Log::info('[orders] SQL Query', ['sql' => $sql, 'bindings' => $bindings]);
            
            $orders = $query
                ->orderBy(DB::raw('COALESCE(os.dataFinal, os.dataInicial)'), 'desc')
                ->limit($limit)
                ->get();
            
            Log::info('[orders] Query results', ['count' => $orders->count()]);
            
            // Normalizar valores numéricos y booleanos
            $orders = $orders->map(function($order) {
                return [
                    'id' => (int)$order->id,
                    'status' => $order->status,
                    'statusPago' => $order->statusPago,
                    'valorTotal' => (float)($order->valorTotal ?? 0),
                    'valorPagado' => (float)($order->valorPagado ?? 0),
                    'pendiente' => (float)($order->pendiente ?? 0),
                    'metros' => $order->metros !== null ? (float)$order->metros : null,
                    'senia' => $order->senia,
                    'lugares_id' => $order->lugares_id,
                    'ts' => $order->ts,
                    'cliente_id' => $order->cliente_id,
                    'cliente_nombre' => $order->cliente_nombre,
                    'area' => $order->area,
                    'usuario_id' => $order->usuario_id,
                    'usuario_nombre' => $order->usuario_nombre,
                    'es_rehacer' => (int)($order->es_rehacer ?? 0),
                    'dataInicial' => $order->fechaIngreso,
                    'fechaIngreso' => $order->fechaIngreso,
                    'fechaEntrega' => $order->fechaEntrega,
                    'lugarEntrega' => $order->lugarEntrega,
                    'lugar' => $order->lugarEntrega,
                    'trabajo' => $order->trabajo,
                    'descripcionProducto' => $order->descripcionProducto,
                    'clase' => $order->clase,
                    'informacionGeneral' => $order->informacionGeneral,
                    'fechaPago' => $order->fechaPago,
                    'esAreaClientes' => (bool)($order->esAreaClientes ?? 0),
                    'hayNOP' => (bool)$order->hayNOP,
                    'activityTs' => time() * 1000,
                ];
            });
            
            return response()->json($orders);
        } catch (\Exception $e) {
            Log::error('[orders] Error listing orders', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al listar órdenes'], 500);
        }
    }
    
    /**
     * POST /api/orders
     * Crea una nueva orden
     */
    public function store(Request $request)
    {
        try {
            $data = $request->all();
            $normalized = $this->normalizeOrderInput($data);
            
            // Insertar orden
            $id = DB::table('os')->insertGetId($normalized);
            
            // Obtener orden creada
            $created = $this->fetchOrderById($id);
            
            // Broadcast SSE
            $this->realtimeService->broadcastOrderChange('insert', $created);
            
            return response()->json([
                'result' => true,
                'id' => $id,
                'order' => $created
            ], 201);
        } catch (\Exception $e) {
            Log::error('[orders] Error creating order', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al crear orden'], 500);
        }
    }
    
    /**
     * GET /api/orders/:id
     * Obtiene una orden específica
     */
    public function show($id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json([
                    'result' => false,
                    'message' => 'ID invalido'
                ], 400);
            }
            
            $order = $this->fetchOrderById((int)$id);
            
            if (!$order) {
                return response()->json([
                    'result' => false,
                    'message' => 'Orden no encontrada'
                ], 404);
            }
            
            return response()->json([
                'result' => true,
                'order' => $order
            ]);
        } catch (\Exception $e) {
            Log::error('[orders] Error fetching order', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al obtener orden'], 500);
        }
    }
    
    /**
     * PUT /api/orders/:id
     * Actualiza una orden existente
     */
    public function update(Request $request, $id)
    {
        try {
            if (!is_numeric($id)) {
                return response()->json([
                    'result' => false,
                    'message' => 'ID invalido'
                ], 400);
            }
            
            $data = $request->all();
            $normalized = $this->normalizeOrderInput($data);
            
            // Actualizar orden
            $affected = DB::table('os')
                ->where('idOs', $id)
                ->update($normalized);
            
            if ($affected === 0) {
                return response()->json([
                    'result' => false,
                    'message' => 'Orden no encontrada'
                ], 404);
            }
            
            // Obtener orden actualizada
            $updated = $this->fetchOrderById((int)$id);
            
            // Broadcast SSE
            $this->realtimeService->broadcastOrderChange('update', $updated);
            
            return response()->json([
                'result' => true,
                'order' => $updated
            ]);
        } catch (\Exception $e) {
            Log::error('[orders] Error updating order', ['id' => $id, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Error al actualizar orden'], 500);
        }
    }
    
    /**
     * Obtiene una orden por ID
     */
    private function fetchOrderById($id)
    {
        $order = DB::table('os as os')
            ->leftJoin('clientes as c', 'os.clientes_id', '=', 'c.idClientes')
            ->leftJoin('usuarios as u', 'os.usuarios_id', '=', 'u.idUsuarios')
            ->leftJoin('lugares_entrega as le', 'le.idLugar', '=', 'os.lugares_id')
            ->where('os.idOs', $id)
            ->select([
                'os.idOs as id',
                'os.status',
                'os.statusPago',
                'os.valorTotal',
                'os.valorPagado',
                'os.pendiente',
                'os.metros',
                'os.senia',
                'os.lugares_id',
                DB::raw('COALESCE(os.dataFinal, os.dataInicial) as ts'),
                'os.clientes_id as cliente_id',
                'c.nomeCliente as cliente_nombre',
                'c.areas_interes as area',
                'os.usuarios_id as usuario_id',
                'u.nome as usuario_nombre',
                'os.es_rehacer',
                'os.dataInicial as fechaIngreso',
                'os.dataFinal as fechaEntrega',
                DB::raw('COALESCE(le.lugar, "") as lugarEntrega'),
                'os.garantia as trabajo',
                'os.observacoes as descripcionProducto',
                'os.defeito as clase',
                'os.laudoTecnico as informacionGeneral',
                DB::raw('NULL as fechaPago'),
                'os.pagadoAreaClientes as esAreaClientes',
                'os.numeroOperacion',
                DB::raw('CASE WHEN os.numeroOperacion IS NOT NULL AND os.numeroOperacion != "" THEN 1 ELSE 0 END as hayNOP')
            ])
            ->first();
        
        if (!$order) {
            return null;
        }
        
        return [
            'id' => (int)$order->id,
            'status' => $order->status,
            'statusPago' => $order->statusPago,
            'valorTotal' => (float)($order->valorTotal ?? 0),
            'valorPagado' => (float)($order->valorPagado ?? 0),
            'pendiente' => (float)($order->pendiente ?? 0),
            'metros' => $order->metros !== null ? (float)$order->metros : null,
            'senia' => $order->senia,
            'lugares_id' => $order->lugares_id,
            'ts' => $order->ts,
            'cliente_id' => $order->cliente_id,
            'cliente_nombre' => $order->cliente_nombre,
            'area' => $order->area,
            'usuario_id' => $order->usuario_id,
            'usuario_nombre' => $order->usuario_nombre,
            'es_rehacer' => (int)($order->es_rehacer ?? 0),
            'fechaIngreso' => $order->fechaIngreso,
            'fechaEntrega' => $order->fechaEntrega,
            'lugarEntrega' => $order->lugarEntrega,
            'lugar' => $order->lugarEntrega,
            'trabajo' => $order->trabajo,
            'descripcionProducto' => $order->descripcionProducto,
            'clase' => $order->clase,
            'informacionGeneral' => $order->informacionGeneral,
            'fechaPago' => $order->fechaPago,
            'esAreaClientes' => (bool)($order->esAreaClientes ?? 0),
            'hayNOP' => (bool)$order->hayNOP,
            'activityTs' => time() * 1000,
        ];
    }
    
    /**
     * Normaliza datos de entrada para inserción/actualización
     */
    private function normalizeOrderInput($input)
    {
        $fieldMap = [
            'status' => 'status',
            'statusPago' => 'statusPago',
            'valorTotal' => 'valorTotal',
            'valorPagado' => 'valorPagado',
            'pendiente' => 'pendiente',
            'metros' => 'metros',
            'senia' => 'senia',
            'lugares_id' => 'lugares_id',
            'fechaIngreso' => 'dataInicial',
            'fechaEntrega' => 'dataFinal',
            'trabajo' => 'garantia',
            'descripcionProducto' => 'observacoes',
            'clase' => 'defeito',
            'informacionGeneral' => 'laudoTecnico',
            'es_rehacer' => 'es_rehacer',
            'esAreaClientes' => 'pagadoAreaClientes',
        ];
        
        $result = [];
        
        foreach ($fieldMap as $key => $column) {
            if (!array_key_exists($key, $input)) {
                continue;
            }
            
            $value = $input[$key];
            
            // Manejar strings vacíos
            if (is_string($value)) {
                $value = trim($value);
                if ($value === '') {
                    $value = null;
                }
            }
            
            // Convertir valores numéricos
            if (in_array($key, ['valorTotal', 'valorPagado', 'pendiente', 'metros'])) {
                $result[$column] = $value !== null ? (float)$value : null;
            }
            // Convertir booleanos
            elseif (in_array($key, ['es_rehacer', 'esAreaClientes'])) {
                $result[$column] = $value ? 1 : 0;
            }
            // Otros valores
            else {
                $result[$column] = $value;
            }
        }
        
        return $result;
    }
}
