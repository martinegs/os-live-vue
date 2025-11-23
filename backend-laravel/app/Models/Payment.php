<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para la tabla pagos
 */
class Payment extends Model
{
    protected $table = 'pagos';
    protected $primaryKey = 'idPago';
    public $timestamps = false;
    
    protected $fillable = [
        'fecha',
        'pagoTotal',
        'descuentoMP',
        'netoRecibido',
        'cargadoDesde',
        'numeroOperacion',
    ];
    
    protected $casts = [
        'pagoTotal' => 'float',
        'descuentoMP' => 'float',
        'netoRecibido' => 'float',
        'fecha' => 'date',
    ];
    
    /**
     * Relación con órdenes a través de tabla pivote
     */
    public function orders()
    {
        return $this->belongsToMany(
            Order::class,
            'os_pagos',
            'pagos_id',
            'os_id',
            'idPago',
            'idOs'
        );
    }
}
