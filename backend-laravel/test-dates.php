<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TEST DE FECHAS EN LA BASE DE DATOS ===\n\n";

// Contar total de órdenes
$total = DB::table('os')->count();
echo "Total de órdenes: {$total}\n\n";

// Obtener algunas órdenes recientes
echo "=== Últimas 5 órdenes ===\n";
$recent = DB::table('os')
    ->orderBy('dataInicial', 'desc')
    ->limit(5)
    ->get(['idOs', 'dataInicial', 'dataFinal']);

foreach ($recent as $order) {
    echo "ID: {$order->idOs} | Inicial: {$order->dataInicial} | Final: {$order->dataFinal}\n";
}

// Contar órdenes en octubre 2025
echo "\n=== Órdenes en octubre 2025 ===\n";
$oct2025 = DB::table('os')
    ->where('dataInicial', '>=', '2025-10-01')
    ->where('dataInicial', '<=', '2025-10-31 23:59:59')
    ->count();
echo "Órdenes en octubre 2025: {$oct2025}\n";

// Contar órdenes en enero 2025
echo "\n=== Órdenes en enero 2025 ===\n";
$jan2025 = DB::table('os')
    ->where('dataInicial', '>=', '2025-01-01')
    ->where('dataInicial', '<=', '2025-01-31 23:59:59')
    ->count();
echo "Órdenes en enero 2025: {$jan2025}\n";

// Distribución por año-mes
echo "\n=== Distribución por año-mes (últimos 12 meses) ===\n";
$distribution = DB::table('os')
    ->select(DB::raw('DATE_FORMAT(dataInicial, "%Y-%m") as year_month, COUNT(*) as count'))
    ->groupBy('year_month')
    ->orderBy('year_month', 'desc')
    ->limit(12)
    ->get();

foreach ($distribution as $row) {
    echo "{$row->year_month}: {$row->count} órdenes\n";
}
