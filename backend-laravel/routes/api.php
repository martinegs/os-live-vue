<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\LancamentoController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\RealtimeController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health Check
Route::get('/health', [HealthController::class, 'index']);

// Autenticación
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Órdenes de Servicio
Route::prefix('orders')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/{id}', [OrderController::class, 'show']);
    Route::put('/{id}', [OrderController::class, 'update']);
});

// Alias para compatibilidad con frontend (os -> orders)
Route::prefix('os')->group(function () {
    Route::get('/', [OrderController::class, 'index']);
    Route::post('/', [OrderController::class, 'store']);
    Route::get('/{id}', [OrderController::class, 'show']);
    Route::put('/{id}', [OrderController::class, 'update']);
});

// Pagos
Route::prefix('payments')->group(function () {
    Route::get('/today', [PaymentController::class, 'today']);
});

// Lançamentos
Route::prefix('lancamentos')->group(function () {
    Route::get('/summary', [LancamentoController::class, 'summary']);
});

// Asistencia
Route::prefix('attendance')->group(function () {
    Route::get('/daily', [AttendanceController::class, 'daily']);
});

// Chat
Route::prefix('chat')->group(function () {
    Route::get('/users', [ChatController::class, 'getAvailableUsers']);
    Route::get('/conversations', [ChatController::class, 'getConversations']);
    Route::get('/messages/{otherUserId}', [ChatController::class, 'getMessages']);
    Route::post('/messages', [ChatController::class, 'sendMessage']);
    Route::put('/messages/read/{otherUserId}', [ChatController::class, 'markAsRead']);
    Route::get('/unread', [ChatController::class, 'getUnreadCount']);
});
