<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para la tabla ordenes (órdenes de servicio)
 */
class Order extends Model
{
    protected $table = 'ordenes';
    protected $primaryKey = 'idOs';
    public $timestamps = false;
    
    protected $fillable = [
        'status',
        'statusPago',
        'valorTotal',
        'valorPagado',
        'pendiente',
        'metros',
        'senia',
        'lugares_id',
        'clientes_id',
        'usuarios_id',
        'es_rehacer',
        'dataInicial',
        'dataFinal',
        'lugarEntrega',
        'garantia',
        'observacoes',
        'defeito',
        'laudoTecnico',
        'fechaPago',
        'pagadoAreaClientes',
        'numeroOperacion',
    ];
    
    protected $casts = [
        'valorTotal' => 'float',
        'valorPagado' => 'float',
        'pendiente' => 'float',
        'metros' => 'float',
        'es_rehacer' => 'integer',
        'pagadoAreaClientes' => 'boolean',
    ];
    
    /**
     * Relación con clientes
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'clientes_id', 'idClientes');
    }
    
    /**
     * Relación con usuarios
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuarios_id', 'idUsuarios');
    }
}
