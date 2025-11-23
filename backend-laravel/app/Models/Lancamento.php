<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para la tabla lancamentos (movimientos/lançamentos)
 */
class Lancamento extends Model
{
    protected $table = 'lancamentos';
    protected $primaryKey = 'id';
    public $timestamps = false;
    
    protected $fillable = [
        'tipo',
        'valor',
        'forma_pgto',
        'data_pagamento',
        'descricao',
    ];
    
    protected $casts = [
        'data_pagamento' => 'date',
    ];
}
