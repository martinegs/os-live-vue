# Script de instalación automática Laravel Chat
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "  Laravel Chat - Instalación" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Composer
Write-Host "[1/5] Verificando Composer..." -ForegroundColor Yellow
$composerCheck = Get-Command composer -ErrorAction SilentlyContinue
if (-not $composerCheck) {
    Write-Host "ERROR: Composer no encontrado" -ForegroundColor Red
    Write-Host "Descarga: https://getcomposer.org/Composer-Setup.exe" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Composer instalado" -ForegroundColor Green

# Crear proyecto Laravel
Write-Host ""
Write-Host "[2/5] Creando proyecto Laravel..." -ForegroundColor Yellow
Write-Host "(Esto tarda 2-3 minutos)" -ForegroundColor Gray

if (Test-Path "temp-laravel") {
    Remove-Item -Recurse -Force temp-laravel
}

composer create-project laravel/laravel temp-laravel --prefer-dist

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: No se pudo crear proyecto Laravel" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Proyecto Laravel creado" -ForegroundColor Green

# Copiar archivos
Write-Host ""
Write-Host "[3/5] Copiando archivos..." -ForegroundColor Yellow

# Guardar archivos custom
$tempCustom = "temp-custom"
New-Item -ItemType Directory -Force -Path $tempCustom | Out-Null

$customFiles = @(
    "app/Http/Controllers/ChatController.php",
    "app/Http/Controllers/RealtimeController.php",
    "app/Models/ChatMessage.php",
    "app/Models/User.php",
    "routes/api.php",
    ".env.example"
)

foreach ($file in $customFiles) {
    if (Test-Path $file) {
        $dest = Join-Path $tempCustom $file
        $destDir = Split-Path $dest -Parent
        New-Item -ItemType Directory -Force -Path $destDir -ErrorAction SilentlyContinue | Out-Null
        Copy-Item $file $dest -Force
    }
}

# Copiar Laravel
Copy-Item -Path "temp-laravel/*" -Destination "." -Recurse -Force

# Restaurar custom
Copy-Item -Path "$tempCustom/*" -Destination "." -Recurse -Force

# Limpiar
Remove-Item -Recurse -Force temp-laravel
Remove-Item -Recurse -Force $tempCustom

Write-Host "OK: Archivos copiados" -ForegroundColor Green

# Configurar .env
Write-Host ""
Write-Host "[4/5] Configurando .env..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
}
php artisan key:generate --ansi
Write-Host "OK: Configuración lista" -ForegroundColor Green

# Instalar dependencias
Write-Host ""
Write-Host "[5/5] Instalando dependencias..." -ForegroundColor Yellow
composer install --optimize-autoloader
Write-Host "OK: Dependencias instaladas" -ForegroundColor Green

# Resumen
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "  INSTALACION COMPLETADA" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciar servidor:" -ForegroundColor Yellow
Write-Host "  php artisan serve --port=4000" -ForegroundColor White
Write-Host ""
Write-Host "Probar:" -ForegroundColor Yellow
Write-Host "  http://localhost:4000/api/chat/users?userId=1" -ForegroundColor White
Write-Host ""
