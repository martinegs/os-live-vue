<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Illuminate\Support\Facades\Storage;

class RealtimeController extends Controller
{
    private static $eventsFile = 'realtime-events.json';
    
    /**
     * Establecer conexión SSE
     */
    public function connect(Request $request)
    {
        // CRÍTICO: Cerrar sesión para no bloquear otras peticiones HTTP
        // PHP bloquea el archivo de sesión hasta que termine el request
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        
        // Siempre usar canal 'all' para unificar todas las conexiones
        $channel = 'all'; // Ignorar el parámetro, usar siempre 'all'
        $userId = $request->input('userId');
        
        $response = new StreamedResponse(function () use ($channel, $userId) {
            $clientId = uniqid('client_', true);
            $lastEventId = 0;
            
            // Enviar headers iniciales
            echo ":" . str_repeat(' ', 2048) . "\n\n";
            echo "event: connected\n";
            echo "data: " . json_encode(['clientId' => $clientId, 'channel' => $channel, 'userId' => $userId]) . "\n\n";
            ob_flush();
            flush();
            
            $startTime = time();
            $lastPing = time();
            
            // Mantener conexión abierta y leer eventos
            while (connection_status() === CONNECTION_NORMAL && (time() - $startTime) < 300) {
                // Leer eventos nuevos
                $events = $this->readEvents($channel, $userId, $lastEventId);
                
                foreach ($events as $event) {
                    if ($event['id'] > $lastEventId) {
                        echo "event: {$event['type']}\n";
                        echo "data: " . json_encode($event['data']) . "\n\n";
                        ob_flush();
                        flush();
                        $lastEventId = $event['id'];
                    }
                }
                
                // Enviar ping cada 5 segundos
                if (time() - $lastPing >= 5) {
                    echo "event: ping\n";
                    echo "data: " . json_encode(['ts' => time()]) . "\n\n";
                    ob_flush();
                    flush();
                    $lastPing = time();
                }
                
                // Esperar un poco antes de volver a chequear
                usleep(500000); // 0.5 segundos
            }
        });
        
        $response->headers->set('Content-Type', 'text/event-stream');
        $response->headers->set('Cache-Control', 'no-cache');
        $response->headers->set('X-Accel-Buffering', 'no');
        $response->headers->set('Connection', 'keep-alive');
        
        // CORS
        $origin = $request->header('Origin');
        if ($origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
        }
        
        return $response;
    }
    
    /**
     * Leer eventos del archivo
     */
    private function readEvents($channel, $userId, $lastEventId)
    {
        try {
            if (!Storage::exists(self::$eventsFile)) {
                return [];
            }
            
            $content = Storage::get(self::$eventsFile);
            $allEvents = json_decode($content, true) ?: [];
            
            // Filtrar eventos por canal y userId
            $filteredEvents = array_filter($allEvents, function($event) use ($channel, $userId, $lastEventId) {
                // Solo eventos más nuevos que el último procesado
                if ($event['id'] <= $lastEventId) {
                    return false;
                }
                
                // Filtrar por canal
                if ($event['channel'] !== $channel) {
                    return false;
                }
                
                // Para canal chat, filtrar por userId
                if ($channel === 'chat' && $userId) {
                    $userIds = $event['userIds'] ?? [];
                    return in_array((int)$userId, $userIds);
                }
                
                return true;
            });
            
            // Limpiar eventos antiguos (más de 1 minuto)
            $this->cleanOldEvents();
            
            return array_values($filteredEvents);
        } catch (\Exception $e) {
            error_log("[SSE] Error leyendo eventos: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Broadcast un evento a todos los clientes
     */
    public static function broadcast($eventType, $data, $options = [])
    {
        try {
            $channel = $options['channel'] ?? 'default';
            $userIds = $options['userIds'] ?? [];
            
            // Leer eventos existentes
            $events = [];
            if (Storage::exists(self::$eventsFile)) {
                $content = Storage::get(self::$eventsFile);
                $events = json_decode($content, true) ?: [];
            }
            
            // Crear nuevo evento
            $event = [
                'id' => time() . mt_rand(1000, 9999),
                'type' => $eventType,
                'channel' => $channel,
                'userIds' => $userIds,
                'data' => $data,
                'timestamp' => now()->toIso8601String()
            ];
            
            $events[] = $event;
            
            // Guardar eventos
            Storage::put(self::$eventsFile, json_encode($events));
            
            error_log("[SSE] Evento broadcast: {$eventType} en canal {$channel}");
        } catch (\Exception $e) {
            error_log("[SSE] Error en broadcast: " . $e->getMessage());
        }
    }
    
    /**
     * Limpiar eventos antiguos
     */
    private function cleanOldEvents()
    {
        try {
            if (!Storage::exists(self::$eventsFile)) {
                return;
            }
            
            $content = Storage::get(self::$eventsFile);
            $events = json_decode($content, true) ?: [];
            
            // Mantener solo eventos de los últimos 60 segundos
            $cutoff = now()->subSeconds(60);
            $events = array_filter($events, function($event) use ($cutoff) {
                $eventTime = \Carbon\Carbon::parse($event['timestamp']);
                return $eventTime->isAfter($cutoff);
            });
            
            Storage::put(self::$eventsFile, json_encode(array_values($events)));
        } catch (\Exception $e) {
            error_log("[SSE] Error limpiando eventos: " . $e->getMessage());
        }
    }
    
    /**
     * Notificar mensaje de chat
     */
    public static function notifyChatMessage($message)
    {
        self::broadcast('chat:message', $message, [
            'channel' => 'chat',
            'userIds' => [$message->sender_id, $message->receiver_id]
        ]);
    }
    
    /**
     * Notificar mensajes leídos
     */
    public static function notifyChatRead($data)
    {
        self::broadcast('chat:read', $data, [
            'channel' => 'chat',
            'userIds' => [$data['reader_id'], $data['sender_id']]
        ]);
    }
}
