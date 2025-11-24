<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\RealtimeController;

class ChatController extends Controller
{
    /**
     * Obtener lista de usuarios disponibles para chatear
     */
    public function getAvailableUsers(Request $request)
    {
        $userId = $request->input('userId');
        
        if (!$userId) {
            error_log("[Chat] getAvailableUsers: userId no proporcionado");
            return response()->json(['users' => []]);
        }
        
        error_log("[Chat] getAvailableUsers: userId={$userId}");
        
        // Obtener todos los usuarios excepto el actual
        $users = User::select([
                'idUsuarios as id',
                'nome as nombre',
                'email',
                'foto as avatar'
            ])
            ->where('idUsuarios', '!=', $userId)
            ->orderBy('nome')
            ->get();
        
        error_log("[Chat] getAvailableUsers: encontrados " . count($users) . " usuarios");
        
        // Agregar contador de mensajes no leídos para cada usuario
        $users = $users->map(function ($user) use ($userId) {
            $unreadCount = ChatMessage::where('sender_id', $user->id)
                ->where('receiver_id', $userId)
                ->whereNull('read_at')
                ->count();
            
            $user->unread_count = $unreadCount;
            return $user;
        });
        
        return response()->json(['users' => $users]);
    }
    
    /**
     * Obtener conversaciones del usuario
     */
    public function getConversations(Request $request)
    {
        $userId = $request->input('userId');
        
        Log::info('[ChatController] getConversations', ['userId' => $userId]);
        
        // Obtener IDs de usuarios con los que hay conversaciones
        $userIds = DB::table('chat_messages')
            ->select(DB::raw('DISTINCT CASE 
                WHEN sender_id = ? THEN receiver_id 
                ELSE sender_id 
            END as other_user_id'))
            ->whereRaw('(sender_id = ? OR receiver_id = ?)', [$userId, $userId])
            ->setBindings([$userId, $userId, $userId])
            ->pluck('other_user_id');
        
        if ($userIds->isEmpty()) {
            Log::info('[ChatController] getConversations - no conversations');
            return response()->json(['conversations' => []]);
        }
        
        // Para cada usuario, obtener datos de la conversación
        $conversations = [];
        foreach ($userIds as $otherUserId) {
            // Obtener usuario
            $user = DB::table('usuarios')
                ->select('idUsuarios as id', 'nome as name', 'foto as avatar')
                ->where('idUsuarios', $otherUserId)
                ->first();
            
            if (!$user) continue;
            
            // Obtener último mensaje
            $lastMsg = DB::table('chat_messages')
                ->select('message', 'created_at')
                ->whereRaw('((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))', 
                    [$userId, $otherUserId, $otherUserId, $userId])
                ->orderBy('id', 'desc')
                ->first();
            
            // Contar no leídos
            $unreadCount = DB::table('chat_messages')
                ->where('sender_id', $otherUserId)
                ->where('receiver_id', $userId)
                ->whereNull('read_at')
                ->count();
            
            $conversations[] = [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'avatar' => $user->avatar,
                'last_message' => $lastMsg->message ?? '',
                'last_message_at' => $lastMsg->created_at ?? null,
                'unread_count' => $unreadCount
            ];
        }
        
        // Ordenar por último mensaje
        usort($conversations, function($a, $b) {
            return ($b['last_message_at'] ?? '') <=> ($a['last_message_at'] ?? '');
        });
        
        Log::info('[ChatController] getConversations - found', ['count' => count($conversations)]);
        
        return response()->json(['conversations' => $conversations]);
    }
    
    /**
     * Obtener mensajes con otro usuario
     */
    public function getMessages(Request $request, $otherUserId)
    {
        $userId = $request->input('userId');
        $since = $request->input('since', 0); // Último mensaje que tiene el cliente
        
        Log::info('[ChatController] getMessages', [
            'userId' => $userId,
            'otherUserId' => $otherUserId,
            'since' => $since
        ]);
        
        if (!$userId) {
            Log::warning('[ChatController] getMessages - userId missing');
            return response()->json(['messages' => []]);
        }
        
        try {
            $query = DB::table('chat_messages')
                ->select([
                    'chat_messages.id',
                    'chat_messages.sender_id',
                    'chat_messages.receiver_id',
                    'chat_messages.message',
                    'chat_messages.created_at',
                    'chat_messages.read_at',
                    'usuarios.nome as sender_name',
                    'usuarios.foto as sender_avatar'
                ])
                ->join('usuarios', 'chat_messages.sender_id', '=', 'usuarios.idUsuarios')
                ->where(function($query) use ($userId, $otherUserId) {
                    $query->where(function($q) use ($userId, $otherUserId) {
                        $q->where('chat_messages.sender_id', $userId)
                          ->where('chat_messages.receiver_id', $otherUserId);
                    })->orWhere(function($q) use ($userId, $otherUserId) {
                        $q->where('chat_messages.sender_id', $otherUserId)
                          ->where('chat_messages.receiver_id', $userId);
                    });
                });
            
            // Polling: solo nuevos mensajes
            if ($since > 0) {
                $query->where('chat_messages.id', '>', $since);
            }
            
            $messages = $query
                ->orderBy('chat_messages.id', 'asc')
                ->limit(50)
                ->get();
            
            Log::info('[ChatController] getMessages - found messages', ['count' => $messages->count()]);
            
            return response()->json(['messages' => $messages]);
        } catch (\Exception $e) {
            Log::error('[ChatController] getMessages error', ['error' => $e->getMessage()]);
            return response()->json(['messages' => [], 'error' => $e->getMessage()]);
        }
    }
    
    /**
     * Enviar un nuevo mensaje
     */
    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiverId' => 'required|integer',
            'message' => 'required|string|max:5000'
        ]);
        
        $userId = $request->input('userId');
        $receiverId = $request->input('receiverId');
        $messageText = trim($request->input('message'));
        
        // Crear mensaje
        $message = ChatMessage::create([
            'sender_id' => $userId,
            'receiver_id' => $receiverId,
            'message' => $messageText
        ]);
        
        // Recargar el mensaje con los datos completos
        $message = ChatMessage::select([
                'chat_messages.*',
                'usuarios.nome as sender_name',
                'usuarios.foto as sender_avatar'
            ])
            ->join('usuarios', 'chat_messages.sender_id', '=', 'usuarios.idUsuarios')
            ->where('chat_messages.id', $message->id)
            ->first();
        
        // Notificar vía SSE
        RealtimeController::notifyChatMessage($message);
        
        return response()->json(['message' => $message], 201);
    }
    
    /**
     * Marcar mensajes como leídos
     */
    public function markAsRead(Request $request, $otherUserId)
    {
        $userId = $request->input('userId');
        
        ChatMessage::where('sender_id', $otherUserId)
            ->where('receiver_id', $userId)
            ->whereNull('read_at')
            ->update([
                'read_at' => now()
            ]);
        
        // Notificar vía SSE
        RealtimeController::notifyChatRead([
            'reader_id' => $userId,
            'sender_id' => $otherUserId,
            'timestamp' => now()->toIso8601String()
        ]);
        
        return response()->json(['success' => true]);
    }
    
    /**
     * Obtener contador de mensajes no leídos
     */
    public function getUnreadCount(Request $request)
    {
        $userId = $request->input('userId');
        $since = $request->input('since', 0); // Timestamp en milisegundos
        
        $query = DB::table('chat_messages')
            ->select([
                'chat_messages.id',
                'chat_messages.sender_id',
                'chat_messages.receiver_id',
                'chat_messages.message',
                'chat_messages.created_at',
                'usuarios.nome as sender_name'
            ])
            ->join('usuarios', 'chat_messages.sender_id', '=', 'usuarios.idUsuarios')
            ->where('chat_messages.receiver_id', $userId)
            ->whereNull('chat_messages.read_at');
        
        // Si hay un timestamp, solo traer mensajes posteriores
        if ($since > 0) {
            $sinceDate = date('Y-m-d H:i:s', $since / 1000);
            $query->where('chat_messages.created_at', '>', $sinceDate);
        }
        
        $messages = $query->orderBy('chat_messages.id', 'desc')
            ->limit(50)
            ->get();
        
        return response()->json([
            'unread_count' => $messages->count(),
            'messages' => $messages
        ]);
    }
}
