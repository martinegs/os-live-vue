<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Servicio para broadcasting de eventos SSE.
 * Maneja conexiones y envío de mensajes en tiempo real.
 */
class RealtimeService
{
    private static $clients = [];
    private static $nextId = 1;
    
    /**
     * Agrega un cliente SSE
     */
    public function addClient($channel, $userId = null)
    {
        $clientId = self::$nextId++;
        
        self::$clients[$clientId] = [
            'id' => $clientId,
            'channel' => $channel,
            'userId' => $userId,
            'connected' => true,
        ];
        
        Log::info('[realtime] Client connected', [
            'clientId' => $clientId,
            'channel' => $channel,
            'userId' => $userId
        ]);
        
        return $clientId;
    }
    
    /**
     * Remueve un cliente SSE
     */
    public function removeClient($clientId)
    {
        if (isset(self::$clients[$clientId])) {
            Log::info('[realtime] Client disconnected', ['clientId' => $clientId]);
            unset(self::$clients[$clientId]);
        }
    }
    
    /**
     * Broadcast de cambios en órdenes
     */
    public function broadcastOrderChange($action, $order)
    {
        $this->broadcast('os', [
            'action' => $action,
            'order' => $order,
        ]);
    }
    
    /**
     * Broadcast de mensaje de chat
     */
    public function broadcastChatMessage($message)
    {
        $recipients = [$message['sender_id'], $message['receiver_id']];
        
        $this->broadcast('chat', [
            'action' => 'new_message',
            'message' => $message,
        ], $recipients);
    }
    
    /**
     * Broadcast de lectura de chat
     */
    public function broadcastChatRead($userId, $otherUserId)
    {
        $this->broadcast('chat', [
            'action' => 'messages_read',
            'userId' => $userId,
            'otherUserId' => $otherUserId,
        ], [$otherUserId]);
    }
    
    /**
     * Envía un evento a todos los clientes del canal especificado
     */
    public function broadcast($channel, $data, $userIds = null)
    {
        $count = 0;
        
        foreach (self::$clients as $client) {
            if ($client['channel'] !== $channel) {
                continue;
            }
            
            // Si se especificaron userIds, filtrar
            if ($userIds !== null && !in_array($client['userId'], $userIds)) {
                continue;
            }
            
            // En implementación real, aquí se enviaría al stream SSE
            // Por ahora solo logueamos
            Log::debug('[realtime] Broadcasting to client', [
                'clientId' => $client['id'],
                'channel' => $channel,
                'userId' => $client['userId']
            ]);
            
            $count++;
        }
        
        Log::info('[realtime] Broadcast sent', [
            'channel' => $channel,
            'recipients' => $count
        ]);
    }
    
    /**
     * Obtiene todos los clientes activos
     */
    public function getClients()
    {
        return self::$clients;
    }
}
