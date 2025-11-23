# Script de Migración Backend: Node.js → Laravel
# DigitalTex - Migración Completa

Write-Host "🚀 Iniciando migración de Node.js a Laravel..." -ForegroundColor Cyan
Write-Host ""

# Verificar ubicación
$backendPath = ".\backend-laravel"
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Error: No se encuentra la carpeta backend-laravel" -ForegroundColor Red
    Write-Host "   Asegúrate de ejecutar este script desde la raíz del proyecto" -ForegroundColor Yellow
    exit 1
}

cd $backendPath

# Verificar PHP
Write-Host "1️⃣ Verificando PHP..." -ForegroundColor Yellow
try {
    $phpVersion = php -v
    Write-Host "✅ PHP encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ PHP no encontrado. Instala PHP 8.2+ primero." -ForegroundColor Red
    exit 1
}

# Verificar Composer
Write-Host ""
Write-Host "2️⃣ Verificando Composer..." -ForegroundColor Yellow
try {
    $composerVersion = composer --version
    Write-Host "✅ Composer encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Composer no encontrado. Instala Composer primero." -ForegroundColor Red
    exit 1
}

# Instalar dependencias
Write-Host ""
Write-Host "3️⃣ Instalando dependencias Laravel..." -ForegroundColor Yellow
try {
    composer install --no-interaction
    Write-Host "✅ Dependencias instaladas" -ForegroundColor Green
} catch {
    Write-Host "❌ Error instalando dependencias" -ForegroundColor Red
    Write-Host "   Intenta ejecutar manualmente: composer install" -ForegroundColor Yellow
    exit 1
}

# Copiar .env
Write-Host ""
Write-Host "4️⃣ Configurando entorno..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Archivo .env creado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Archivo .env ya existe (no se sobrescribió)" -ForegroundColor Yellow
}

# Generar clave
Write-Host ""
Write-Host "5️⃣ Generando clave de aplicación..." -ForegroundColor Yellow
try {
    php artisan key:generate --force
    Write-Host "✅ Clave generada" -ForegroundColor Green
} catch {
    Write-Host "❌ Error generando clave" -ForegroundColor Red
}

# Información de configuración
Write-Host ""
Write-Host "6️⃣ Configuración de Base de Datos" -ForegroundColor Yellow
Write-Host "   Edita el archivo .env con tus credenciales:" -ForegroundColor White
Write-Host ""
Write-Host "   DB_CONNECTION=mysql" -ForegroundColor Gray
Write-Host "   DB_HOST=srv1526.hstgr.io" -ForegroundColor Gray
Write-Host "   DB_PORT=3306" -ForegroundColor Gray
Write-Host "   DB_DATABASE=u472469844_digital_sys" -ForegroundColor Gray
Write-Host "   DB_USERNAME=u472469844_digtex" -ForegroundColor Gray
Write-Host "   DB_PASSWORD=<tu_password>" -ForegroundColor Gray
Write-Host ""

# Preguntar si configurar ahora
$configurar = Read-Host "¿Deseas abrir el archivo .env para configurar ahora? (s/n)"
if ($configurar -eq "s" -or $configurar -eq "S") {
    notepad .env
    Write-Host "⏳ Esperando a que cierres el editor..." -ForegroundColor Yellow
}

# Ejecutar migraciones
Write-Host ""
Write-Host "7️⃣ Ejecutando migraciones (tablas de chat)..." -ForegroundColor Yellow
$migrar = Read-Host "¿Deseas ejecutar las migraciones ahora? (s/n)"
if ($migrar -eq "s" -or $migrar -eq "S") {
    try {
        php artisan migrate --force
        Write-Host "✅ Migraciones ejecutadas" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Error ejecutando migraciones (verifica credenciales DB)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏩ Migraciones omitidas (ejecuta después: php artisan migrate)" -ForegroundColor Yellow
}

# Resumen final
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ MIGRACIÓN COMPLETA" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Archivos migrados:" -ForegroundColor White
Write-Host "   ✅ AuthController.php         (Login)" -ForegroundColor Green
Write-Host "   ✅ OrderController.php        (Órdenes CRUD)" -ForegroundColor Green
Write-Host "   ✅ PaymentController.php      (Resumen pagos)" -ForegroundColor Green
Write-Host "   ✅ LancamentoController.php   (Resumen movimientos)" -ForegroundColor Green
Write-Host "   ✅ AttendanceController.php   (Asistencia diaria)" -ForegroundColor Green
Write-Host "   ✅ HealthController.php       (Health check)" -ForegroundColor Green
Write-Host "   ✅ ChatController.php         (Chat tiempo real)" -ForegroundColor Green
Write-Host "   ✅ RealtimeController.php     (SSE)" -ForegroundColor Green
Write-Host ""
Write-Host "📡 Endpoints disponibles:" -ForegroundColor White
Write-Host "   • POST   /api/auth/login" -ForegroundColor Gray
Write-Host "   • GET    /api/orders" -ForegroundColor Gray
Write-Host "   • POST   /api/orders" -ForegroundColor Gray
Write-Host "   • GET    /api/orders/{id}" -ForegroundColor Gray
Write-Host "   • PUT    /api/orders/{id}" -ForegroundColor Gray
Write-Host "   • GET    /api/payments/today" -ForegroundColor Gray
Write-Host "   • GET    /api/lancamentos/summary" -ForegroundColor Gray
Write-Host "   • GET    /api/attendance/daily" -ForegroundColor Gray
Write-Host "   • GET    /api/health" -ForegroundColor Gray
Write-Host "   • GET    /api/chat/*" -ForegroundColor Gray
Write-Host "   • GET    /api/realtime" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Siguiente paso:" -ForegroundColor White
Write-Host "   1. Verifica la configuración en .env" -ForegroundColor Yellow
Write-Host "   2. Ejecuta: php artisan serve --host=0.0.0.0 --port=4000" -ForegroundColor Yellow
Write-Host "   3. Accede a: http://localhost:4000/api/health" -ForegroundColor Yellow
Write-Host ""
Write-Host "📚 Documentación:" -ForegroundColor White
Write-Host "   • MIGRACION-COMPLETA.md      → Guía completa" -ForegroundColor Cyan
Write-Host "   • COMPARACION-ENDPOINTS.md   → Equivalencias" -ForegroundColor Cyan
Write-Host "   • INSTALACION-MANUAL.md      → Instalación manual" -ForegroundColor Cyan
Write-Host ""

# Preguntar si iniciar servidor
$iniciar = Read-Host "¿Deseas iniciar el servidor Laravel ahora? (s/n)"
if ($iniciar -eq "s" -or $iniciar -eq "S") {
    Write-Host ""
    Write-Host "🌐 Iniciando servidor en http://localhost:4000..." -ForegroundColor Cyan
    Write-Host "   Presiona Ctrl+C para detener" -ForegroundColor Yellow
    Write-Host ""
    php artisan serve --host=0.0.0.0 --port=4000
} else {
    Write-Host ""
    Write-Host "👍 Puedes iniciar el servidor manualmente con:" -ForegroundColor Green
    Write-Host "   php artisan serve --host=0.0.0.0 --port=4000" -ForegroundColor White
    Write-Host ""
}
