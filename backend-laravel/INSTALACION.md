# 🚀 Instalación Backend Laravel - Sistema de Chat

## Paso 1: Instalar Composer

Si no tienes Composer instalado:
1. Descarga de: https://getcomposer.org/Composer-Setup.exe
2. Ejecuta el instalador
3. Reinicia el terminal

## Paso 2: Crear proyecto Laravel completo

```powershell
cd C:\Users\MArti\OneDrive\Documentos\Proyectos\JavaScript\DigitalTex\backend-laravel
composer create-project laravel/laravel temp-laravel "11.*"
```

## Paso 3: Mover archivos Laravel a la carpeta actual

```powershell
# Copiar todos los archivos del proyecto Laravel temporal
xcopy /E /I /Y temp-laravel\* .

# Eliminar carpeta temporal
rmdir /S /Q temp-laravel
```

## Paso 4: Configurar base de datos

```powershell
# Copiar archivo de configuración
copy .env.example .env

# Generar clave de aplicación
php artisan key:generate
```

## Paso 5: Sobrescribir con nuestros archivos del chat

Los archivos ya están listos en:
- `app/Http/Controllers/ChatController.php` ✅
- `app/Http/Controllers/RealtimeController.php` ✅  
- `app/Models/ChatMessage.php` ✅
- `app/Models/User.php` ✅
- `routes/api.php` ✅

## Paso 6: Iniciar servidor Laravel

```powershell
php artisan serve --port=4000
```

El servidor estará disponible en: http://localhost:4000

## Paso 7: Probar endpoints

### Usuarios disponibles
```
GET http://localhost:4000/api/chat/users?userId=1
```

### Enviar mensaje
```
POST http://localhost:4000/api/chat/messages?userId=1
Content-Type: application/json

{
  "receiverId": 41,
  "message": "Hola desde Laravel!"
}
```

### SSE Tiempo Real
```
GET http://localhost:4000/realtime?channel=chat&userId=1
```

## Frontend - Cambiar URL

En `src/components/ChatWidget.vue` (línea ~211):

```javascript
// Cambiar:
const API_BASE = 'http://localhost:4000';

// NO necesita cambios, ya apunta al puerto 4000
```

---

## ✅ Ventajas de Laravel vs Node.js

1. **Más simple**: Eloquent ORM es más fácil que SQL manual
2. **Mejor organizado**: MVC nativo de Laravel
3. **Menos archivos**: Todo en controladores claros
4. **Migrations nativas**: Sistema de versionado de BD
5. **Validación incluida**: `$request->validate()` automático
6. **Logs mejores**: Sistema de logging robusto
7. **Caché nativo**: Para optimizaciones futuras
8. **Hosting compatible**: Hostinger soporta Laravel perfecto

## 🐛 Si tienes problemas

1. **Composer no funciona**: Reinstala desde getcomposer.org
2. **Puerto 4000 ocupado**: Usa `--port=8000` 
3. **Error BD**: Verifica credenciales en `.env`
4. **CORS**: Laravel maneja CORS automáticamente

¡Listo! Ahora tienes el mismo chat pero en Laravel 🎉
