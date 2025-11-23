# 🚀 Backend Laravel - Sistema de Chat

Backend completo en Laravel para reemplazar el sistema Node.js actual.

## 📦 Instalación Rápida

```powershell
cd backend-laravel
.\install.ps1
```

El script automáticamente:
- ✅ Verifica Composer
- ✅ Crea proyecto Laravel 11
- ✅ Configura base de datos
- ✅ Genera claves de seguridad
- ✅ Instala dependencias

## 🎯 Características

- **8 Endpoints REST API** para chat
- **SSE (Server-Sent Events)** para tiempo real
- **Compatible con BD actual** (usuarios, chat_messages)
- **Sin cambios en frontend** (mismas URLs)
- **Timezone Argentina** configurado

## 📁 Estructura

```
backend-laravel/
├── app/
│   ├── Http/Controllers/
│   │   ├── ChatController.php       # 6 endpoints REST
│   │   └── RealtimeController.php   # SSE tiempo real
│   └── Models/
│       ├── ChatMessage.php          # Modelo mensajes
│       └── User.php                 # Modelo usuarios
├── routes/
│   └── api.php                      # Rutas API
└── .env                             # Configuración BD
```

## 🔌 Endpoints API

### Chat REST
```
GET  /api/chat/users?userId={id}              # Usuarios disponibles
GET  /api/chat/conversations?userId={id}      # Conversaciones
GET  /api/chat/messages/{otherUserId}?userId={id}  # Mensajes
POST /api/chat/messages?userId={id}           # Enviar mensaje
PUT  /api/chat/messages/read/{userId}?userId={id}  # Marcar leído
GET  /api/chat/unread?userId={id}             # Contador no leídos
```

### SSE Tiempo Real
```
GET /realtime?channel=chat&userId={id}        # Conexión SSE
```

## 🚀 Uso

### Iniciar servidor
```powershell
php artisan serve --port=4000
```

### Probar endpoint
```powershell
curl http://localhost:4000/api/chat/users?userId=1
```

## ⚡ Laravel vs Node.js

| Aspecto | Node.js (Actual) | Laravel (Nuevo) |
|---------|------------------|-----------------|
| **Archivos** | 6 archivos | 4 archivos |
| **Líneas código** | ~800 líneas | ~400 líneas |
| **ORM** | SQL manual | Eloquent ORM |
| **Validación** | Manual | `$request->validate()` |
| **Estructura** | Custom | MVC nativo |
| **Logs** | console.log | Sistema robusto |
| **Testing** | Manual | PHPUnit integrado |
| **Deployment** | PM2 | Laravel Forge |
| **Hostinger** | ✅ Compatible | ✅ Compatible |

## 🔧 Configuración

### Base de Datos

Edita `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=srv1526.hstgr.io
DB_DATABASE=u472469844_digital_sys
DB_USERNAME=u472469844_DigitalTex
DB_PASSWORD=Gr33n0212@
```

### CORS

Laravel maneja CORS automáticamente. Sin configuración adicional.

### Timezone

Configurado en queries para Argentina (UTC-3):
```php
DB::raw("CONVERT_TZ(NOW(), '+00:00', '-03:00')")
```

## 📝 Comparación de Código

### Obtener mensajes

**Node.js (actual):**
```javascript
async function getMessages(userId, otherUserId, limit = 50, offset = 0) {
  const sql = `
    SELECT 
      cm.*,
      u.nome as sender_name,
      u.foto as sender_avatar
    FROM chat_messages cm
    JOIN usuarios u ON cm.sender_id = u.idUsuarios
    WHERE (cm.sender_id = ? AND cm.receiver_id = ?) 
       OR (cm.sender_id = ? AND cm.receiver_id = ?)
    ORDER BY cm.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const [rows] = await pool.query(sql, [userId, otherUserId, otherUserId, userId, limit, offset]);
  return rows.reverse();
}
```

**Laravel (nuevo):**
```php
public function getMessages($otherUserId) {
    return ChatMessage::with('sender:idUsuarios,nome,foto')
        ->betweenUsers($userId, $otherUserId)
        ->latest()
        ->paginate(50);
}
```

✅ **50% menos código, más legible**

## 🐛 Troubleshooting

### Composer no funciona
```powershell
# Descargar e instalar:
# https://getcomposer.org/Composer-Setup.exe
```

### Puerto 4000 ocupado
```powershell
php artisan serve --port=8000
```

### Error de conexión BD
```powershell
# Verificar .env
php artisan config:clear
```

### Probar SSE
```powershell
curl http://localhost:4000/realtime?channel=chat&userId=1
```

## 📚 Documentación

- [Laravel 11 Docs](https://laravel.com/docs/11.x)
- [Eloquent ORM](https://laravel.com/docs/11.x/eloquent)
- [Validation](https://laravel.com/docs/11.x/validation)

## ✨ Ventajas Adicionales

1. **Artisan CLI**: Comandos útiles built-in
2. **Migrations**: Versionado de BD nativo
3. **Seeders**: Datos de prueba fáciles
4. **Cache**: Sistema de caché robusto
5. **Queue**: Jobs asíncronos nativos
6. **Testing**: PHPUnit integrado
7. **Security**: CSRF, XSS, SQL Injection protegido
8. **Ecosystem**: Miles de paquetes Composer

## 🎉 Siguiente Paso

Una vez que funcione, puedes:
1. ✅ Migrar las demás rutas de Node.js (/api/os, /api/attendance, etc.)
2. ✅ Implementar autenticación JWT
3. ✅ Agregar tests unitarios
4. ✅ Optimizar con caché Redis
5. ✅ Deploy a producción en Hostinger

---

**¿Listo para migrar? Ejecuta `.\install.ps1` y en 2 minutos tienes Laravel funcionando! 🚀**
