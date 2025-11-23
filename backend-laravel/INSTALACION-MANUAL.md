# ⚠️ Instalación Manual - Laravel Chat

## Problema detectado
El script automático tiene problemas con SSL y extensiones PHP. 
Instalaremos Laravel manualmente.

## 📝 Pasos Manual

### 1. Descargar Laravel
Opción A - Desde navegador:
1. Ve a: https://github.com/laravel/laravel/archive/refs/heads/11.x.zip
2. Descarga el ZIP
3. Extrae en: `C:\Users\MArti\OneDrive\Documentos\Proyectos\JavaScript\DigitalTex\backend-laravel\`

Opción B - Composer (si funciona):
```powershell
cd C:\Users\MArti\OneDrive\Documentos\Proyectos\JavaScript\DigitalTex
composer create-project laravel/laravel backend-laravel-temp
# Luego copiar archivos
```

### 2. Los archivos del Chat ya están listos ✅

Ya tienes estos archivos creados:
- ✅ `app/Http/Controllers/ChatController.php`
- ✅ `app/Http/Controllers/RealtimeController.php`
- ✅ `app/Models/ChatMessage.php`
- ✅ `app/Models/User.php`
- ✅ `routes/api.php`
- ✅ `.env.example`

### 3. Configurar .env

Copia `.env.example` a `.env` y edita:

```env
APP_NAME=DigitalTexChat
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:4000

DB_CONNECTION=mysql
DB_HOST=srv1526.hstgr.io
DB_PORT=3306
DB_DATABASE=u472469844_digital_sys
DB_USERNAME=u472469844_DigitalTex
DB_PASSWORD=Gr33n0212@
```

### 4. Generar APP_KEY

```powershell
php artisan key:generate
```

### 5. Instalar dependencias

```powershell
composer install
```

Si falla composer, puedes:
- Descargar vendor.zip pre-compilado
- O usar Laravel sin composer (solo los archivos necesarios)

### 6. Iniciar servidor

```powershell
php artisan serve --port=4000
```

## 🔧 Alternativa Más Simple

Si Composer sigue dando problemas, **mantén Node.js** que ya funciona:

El bug del chat en Node.js ya está arreglado en `server/realtime.js` (línea 320).

Solo necesitas:
```powershell
npm run dev
```

Y el chat funcionará perfectamente con Node.js.

## 📊 Decisión

| Opción | Pros | Contras |
|--------|------|---------|
| **Laravel** | Más organizado, mejor para futuro | Requiere Composer funcionando |
| **Node.js** | Ya funciona, sin dependencias extra | Menos estructurado |

**Mi recomendación**: 
Usa Node.js por ahora (ya arreglé el bug), y migra a Laravel cuando tengas Composer configurado correctamente.

## ✅ Para usar Node.js (recomendado ahora)

```powershell
cd C:\Users\MArti\OneDrive\Documentos\Proyectos\JavaScript\DigitalTex
npm run dev
```

El chat ya debería funcionar correctamente. El problema del `userId is not defined` está arreglado.

---

**¿Qué prefieres hacer?**
1. Arreglar Composer y seguir con Laravel
2. Usar Node.js que ya funciona
