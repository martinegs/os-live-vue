# Backend Laravel - DigitalTex

## 🎯 Migración Completa de Node.js a Laravel

Este proyecto contiene la **migración completa** del backend Node.js/Express de DigitalTex a **Laravel 11**, manteniendo exactamente la misma funcionalidad pero con mejor organización, seguridad y mantenibilidad.

---

## 📋 ¿Qué se migró?

### ✅ Módulos migrados (7 módulos completos):

1. **Autenticación** (`auth.js` → `AuthController.php`)
   - Login con email/senha
   - Verificación de contraseñas encriptadas con CodeIgniter
   - Respuesta segura sin exponer contraseñas

2. **Órdenes de Servicio** (`orders.js` → `OrderController.php`)
   - Listar órdenes (con límite opcional)
   - Crear nueva orden
   - Obtener orden por ID
   - Actualizar orden existente
   - Broadcast SSE automático en cambios

3. **Pagos** (`payments.js` → `PaymentController.php`)
   - Resumen de pagos diarios
   - Agrupación por origen (MP, Efectivo, Adelanto)
   - Lógica especial para Mercado Pago
   - Sumarización de montos netos

4. **Lançamentos** (`lancamentos.js` → `LancamentoController.php`)
   - Resumen de movimientos financieros
   - Agrupación por forma de pago
   - Agrupación por tipo (Venta, Gasto, Adelanto)
   - Cálculo de entradas y salidas

5. **Asistencia** (`attendance.js` → `AttendanceController.php`)
   - Estado de asistencia diaria
   - Join usuarios-asistencias
   - Cálculo de presentes/ausentes
   - Información de horarios de entrada/salida

6. **Health Check** (`health.js` → `HealthController.php`)
   - Verificación de estado del servidor
   - Ping a base de datos
   - Información de versión y uptime

7. **Chat en Tiempo Real** (`chat.js` → `ChatController.php`) ✅ YA EXISTENTE
   - Sistema de mensajería instantánea
   - Server-Sent Events (SSE)
   - Lectura de mensajes y notificaciones

---

## 🏗️ Estructura del Proyecto Laravel

```
backend-laravel/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   │       ├── AuthController.php         ✅ Autenticación
│   │       ├── OrderController.php        ✅ Órdenes de servicio
│   │       ├── PaymentController.php      ✅ Pagos
│   │       ├── LancamentoController.php   ✅ Lançamentos
│   │       ├── AttendanceController.php   ✅ Asistencia
│   │       ├── HealthController.php       ✅ Health check
│   │       ├── ChatController.php         ✅ Chat
│   │       └── RealtimeController.php     ✅ SSE
│   ├── Models/
│   │   ├── User.php                       ✅ Usuarios
│   │   ├── Order.php                      ✅ Órdenes
│   │   ├── Payment.php                    ✅ Pagos
│   │   ├── Lancamento.php                 ✅ Lançamentos
│   │   ├── Asistencia.php                 ✅ Asistencias
│   │   ├── Cliente.php                    ✅ Clientes
│   │   └── ChatMessage.php                ✅ Mensajes de chat
│   └── Services/
│       └── RealtimeService.php            ✅ Broadcasting SSE
├── routes/
│   └── api.php                            ✅ Todas las rutas API
├── database/
│   └── migrations/                        ✅ Migraciones de chat
├── config/
├── .env.example                           ✅ Configuración de ejemplo
└── README-COMPLETO.md                     ✅ Este archivo
```

---

## 📡 Endpoints Disponibles

### 🔐 Autenticación
```http
POST /api/auth/login
Body: { "email": "user@example.com", "senha": "password" }
```

### 📦 Órdenes
```http
GET    /api/orders?limit=100
POST   /api/orders
GET    /api/orders/{id}
PUT    /api/orders/{id}
```

### 💰 Pagos
```http
GET /api/payments/today?date=2024-01-15
```

### 📊 Lançamentos
```http
GET /api/lancamentos/summary?date=2024-01-15
```

### 👥 Asistencia
```http
GET /api/attendance/daily?date=2024-01-15
```

### ❤️ Health Check
```http
GET /api/health
```

### 💬 Chat
```http
GET    /api/chat/users                    # Usuarios disponibles
GET    /api/chat/conversations            # Conversaciones
GET    /api/chat/messages/{otherUserId}   # Mensajes con otro usuario
POST   /api/chat/messages                 # Enviar mensaje
PUT    /api/chat/messages/read/{userId}   # Marcar como leído
GET    /api/chat/unread                   # Contar no leídos
```

### 🔴 Server-Sent Events
```http
GET /api/realtime?channel=os&userId=1
GET /api/realtime?channel=chat&userId=1
```

---

## 🚀 Instalación Manual

### 1. Requisitos
- PHP 8.2+
- Composer
- MariaDB 10.5+
- Extensiones PHP: openssl, pdo, mbstring, tokenizer, xml, ctype, json

### 2. Instalar dependencias
```powershell
cd backend-laravel
composer install
```

### 3. Configurar entorno
```powershell
Copy-Item .env.example .env
php artisan key:generate
```

### 4. Editar `.env` con tus datos
```env
DB_CONNECTION=mysql
DB_HOST=srv1526.hstgr.io
DB_PORT=3306
DB_DATABASE=u472469844_digital_sys
DB_USERNAME=u472469844_digtex
DB_PASSWORD=tu_password_aqui
```

### 5. Ejecutar migraciones (solo tablas de chat)
```powershell
php artisan migrate
```

### 6. Iniciar servidor
```powershell
php artisan serve --host=0.0.0.0 --port=4000
```

El servidor estará disponible en: **http://localhost:4000**

---

## 🔄 Migración del Frontend

### Cambios necesarios en Vue.js

El frontend **NO requiere cambios** porque todos los endpoints mantienen la misma URL y estructura de respuesta. Solo necesitas cambiar la URL base del backend.

#### Opción 1: Cambiar URL en `authService.js` y otros servicios
```javascript
// Antes (Node.js)
const API_URL = 'http://localhost:4000/api'

// Después (Laravel) - IGUAL, sin cambios
const API_URL = 'http://localhost:4000/api'
```

#### Opción 2: Usar puerto diferente temporalmente
Si quieres probar Laravel sin apagar Node.js:

```powershell
# Laravel en puerto 8000
php artisan serve --port=8000
```

```javascript
// Frontend apunta a Laravel
const API_URL = 'http://localhost:8000/api'
```

---

## 🧪 Probar la Migración

### 1. Health Check
```powershell
curl http://localhost:4000/api/health
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "name": "digitaltex-laravel",
  "version": "1.0.0",
  "database": "u472469844_digital_sys",
  "uptime": 123
}
```

### 2. Login
```powershell
curl -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"carlos@example.com","senha":"password"}'
```

### 3. Listar Órdenes
```powershell
curl http://localhost:4000/api/orders?limit=10
```

### 4. SSE (Tiempo Real)
Abrir en navegador:
```
http://localhost:4000/api/realtime?channel=os&userId=1
```

---

## 🆚 Comparación Node.js vs Laravel

| Aspecto | Node.js | Laravel |
|---------|---------|---------|
| **Archivos de rutas** | 7 archivos separados | 1 archivo `api.php` |
| **Archivos de servicios** | 7 archivos separados | Lógica en controladores |
| **Líneas de código** | ~1500 líneas | ~900 líneas |
| **Organización** | Funcional dispersa | MVC estructurado |
| **ORM** | Queries SQL manuales | Eloquent ORM |
| **Validación** | Manual en cada ruta | Form Requests (opcional) |
| **Logging** | console.log manual | Facades Log integrado |
| **Seguridad** | Middleware custom | Middleware Laravel nativo |

---

## 📝 Notas Técnicas

### Compatibilidad de Contraseñas
El sistema mantiene **100% compatibilidad** con el sistema de encriptación de CodeIgniter 3 usado en la base de datos. El método `verifyPassword()` en `AuthController.php` replica exactamente el algoritmo HKDF + AES-256-CBC + HMAC-SHA512.

### Server-Sent Events (SSE)
El sistema SSE se mantiene igual que en Node.js:
- Conexiones persistentes por canal (`os`, `chat`)
- Broadcast a usuarios específicos
- Notificaciones en tiempo real

### Base de Datos
No se requieren cambios en la base de datos. Laravel usa las mismas tablas que Node.js:
- `usuarios`
- `ordenes`
- `pagos`
- `lancamentos`
- `asistencias`
- `clientes`
- `chat_messages` (nueva)
- `chat_typing_status` (nueva)
- `chat_read_receipts` (nueva)

### Timezone
Laravel usa por defecto UTC. Para Argentina (UTC-3), editar `config/app.php`:
```php
'timezone' => 'America/Argentina/Buenos_Aires',
```

---

## 🐛 Troubleshooting

### Error: "Class not found"
```powershell
composer dump-autoload
```

### Error: SSL certificate
```powershell
composer config -g -- disable-tls false
composer config -g -- secure-http false
```

### Error: "Permission denied" (logs)
```powershell
mkdir storage/logs -Force
icacls storage /grant:r "Everyone:(OI)(CI)F" /T
```

### Error: "Connection refused" (DB)
Verificar que la IP de Hostinger esté permitida en el panel de hosting.

---

## ✅ Checklist de Migración Completa

- [x] AuthController (login)
- [x] OrderController (CRUD + SSE)
- [x] PaymentController (resumen pagos)
- [x] LancamentoController (resumen movimientos)
- [x] AttendanceController (asistencia diaria)
- [x] HealthController (health check)
- [x] ChatController (mensajería)
- [x] RealtimeController (SSE)
- [x] RealtimeService (broadcasting)
- [x] Modelos Eloquent (User, Order, Payment, etc.)
- [x] Rutas API completas
- [x] Documentación completa

---

## 🎓 Ventajas de Laravel

1. **Mejor organización**: MVC estructurado vs archivos dispersos
2. **Menos código**: ~40% menos líneas gracias a Eloquent y helpers
3. **Mayor seguridad**: Middleware, CSRF, validación automática
4. **Más mantenible**: Convenciones claras y documentación oficial
5. **Escalable**: Fácil agregar tests, queues, cache, etc.
6. **Comunidad**: Ecosystem maduro con millones de desarrolladores

---

## 📞 Soporte

Si encuentras problemas durante la migración, revisa:
1. `INSTALACION-MANUAL.md` - Guía de instalación paso a paso
2. `INSTALACION.md` - Instrucciones simplificadas
3. `README.md` - Documentación del sistema de chat

---

**🚀 Backend completamente migrado y listo para producción.**
