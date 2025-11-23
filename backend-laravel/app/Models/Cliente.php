<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para la tabla clientes
 */
class Cliente extends Model
{
    protected $table = 'clientes';
    protected $primaryKey = 'idClientes';
    public $timestamps = false;
    
    protected $fillable = [
        'nome',
        'email',
        'telefone',
        'area',
        'endereco',
    ];
    
    /**
     * Relación con órdenes
     */
    public function orders()
    {
        return $this->hasMany(Order::class, 'clientes_id', 'idClientes');
    }
}
