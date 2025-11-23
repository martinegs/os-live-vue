<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $table = 'chat_messages';
    
    // Laravel maneja created_at automáticamente
    const UPDATED_AT = null; // No usamos updated_at
    
    protected $fillable = [
        'sender_id',
        'receiver_id',
        'message',
        'read_at',
        'deleted_by_sender',
        'deleted_by_receiver'
    ];
    
    protected $casts = [
        'created_at' => 'datetime',
        'read_at' => 'datetime',
        'deleted_by_sender' => 'boolean',
        'deleted_by_receiver' => 'boolean',
    ];
    
    // Relación con el remitente
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id', 'idUsuarios');
    }
    
    // Relación con el receptor
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id', 'idUsuarios');
    }
    
    // Scope para mensajes entre dos usuarios
    public function scopeBetweenUsers($query, $userId1, $userId2)
    {
        return $query->where(function ($q) use ($userId1, $userId2) {
            $q->where('sender_id', $userId1)->where('receiver_id', $userId2);
        })->orWhere(function ($q) use ($userId1, $userId2) {
            $q->where('sender_id', $userId2)->where('receiver_id', $userId1);
        });
    }
}
