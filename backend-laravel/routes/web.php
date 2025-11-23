<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\RealtimeController;

Route::get('/', function () {
    return view('welcome');
});

// Server-Sent Events (SSE) para tiempo real
Route::get('/realtime', [RealtimeController::class, 'connect']);
Route::get('/realtime/stream', [RealtimeController::class, 'connect']);
