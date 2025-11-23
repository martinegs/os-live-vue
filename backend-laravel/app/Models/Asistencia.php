<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para la tabla asistencias
 */
class Asistencia extends Model
{
    protected $table = 'asistencias';
    protected $primaryKey = 'id';
    public $timestamps = false;
    
    protected $fillable = [
        'idUsuario',
        'fecha',
        'horaEntrada',
        'horaSalida',
    ];
    
    protected $casts = [
        'fecha' => 'date',
    ];
    
    /**
     * Relación con usuarios
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'idUsuario', 'idAsistencias');
    }
}
