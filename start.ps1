# Script para iniciar Frontend (Vue) y Backend (Laravel)
# DigitalTex - Sistema completo

Write-Host "Iniciando DigitalTex..." -ForegroundColor Cyan
Write-Host ""

# Funcion para matar procesos en puertos especificos
function Stop-ProcessOnPort {
    param([int]$Port)
    
    $process = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty OwningProcess -First 1
    
    if ($process) {
        Write-Host "Puerto $Port ocupado. Liberando..." -ForegroundColor Yellow
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# Liberar puertos si estan ocupados
Stop-ProcessOnPort 5173  # Frontend Vite
Stop-ProcessOnPort 4000  # Backend Laravel

Write-Host "Iniciando Frontend Vue (puerto 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Iniciando Backend Laravel (puerto 4000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend-laravel'; php artisan serve --host=0.0.0.0 --port=4000" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SISTEMA INICIADO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Frontend Vue:    http://localhost:5173" -ForegroundColor White
Write-Host "Backend Laravel: http://localhost:4000" -ForegroundColor White
Write-Host ""
Write-Host "Endpoints API disponibles:" -ForegroundColor Yellow
Write-Host "  POST /api/auth/login" -ForegroundColor Gray
Write-Host "  GET  /api/os" -ForegroundColor Gray
Write-Host "  GET  /api/payments/today" -ForegroundColor Gray
Write-Host "  GET  /api/lancamentos/summary" -ForegroundColor Gray
Write-Host "  GET  /api/attendance/daily" -ForegroundColor Gray
Write-Host "  GET  /api/chat/*" -ForegroundColor Gray
Write-Host "  GET  /realtime" -ForegroundColor Gray
Write-Host ""
Write-Host "Para detener: Cierra las ventanas de PowerShell o presiona Ctrl+C" -ForegroundColor Cyan
Write-Host ""

# Esperar tecla para cerrar
Read-Host "Presiona Enter para cerrar este mensaje"
