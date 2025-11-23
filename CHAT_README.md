# Sistema de Chat en Tiempo Real - DigitalTex

Sistema de mensajería instantánea estilo Facebook Messenger integrado en DigitalTex.

## 📋 Características Implementadas

### Backend
- ✅ Tabla de base de datos `chat_messages` con soft delete
- ✅ Servicio de chat (`chatService.js`) con todas las operaciones CRUD
- ✅ Endpoints REST para mensajes, conversaciones y búsqueda de usuarios
- ✅ Integración con SSE (Server-Sent Events) para actualizaciones en tiempo real
- ✅ Sistema de notificaciones de mensajes no leídos

### Frontend
- ✅ Widget de chat flotante estilo Facebook Messenger
- ✅ Lista de conversaciones con preview del último mensaje
- ✅ Búsqueda de usuarios en tiempo real
- ✅ Interfaz de mensajería con diseño moderno
- ✅ Notificaciones visuales de mensajes no leídos
- ✅ Marcado automático de mensajes como leídos
- ✅ Scroll automático al enviar/recibir mensajes

## 🚀 Instalación

### 1. Ejecutar la migración de base de datos

```bash
# Conectarse a MySQL
mysql -u u371726528_dtex -p u371726528_dtex

# Ejecutar el script SQL
source server/migrations/create_chat_tables.sql
```

O ejecutar manualmente el contenido del archivo `server/migrations/create_chat_tables.sql` en tu gestor de base de datos.

### 2. Instalar dependencias (si es necesario)

Las dependencias ya están incluidas en el proyecto. Solo asegúrate de tener todo actualizado:

```bash
npm install
```

### 3. Iniciar el servidor

```bash
npm run dev
```

## 📖 Uso

### Para los usuarios

1. **Iniciar sesión** en la aplicación
2. El **icono de chat** aparecerá en la esquina inferior derecha
3. **Click en el icono** para abrir el widget de chat
4. **Buscar usuarios** escribiendo en el campo de búsqueda
5. **Iniciar conversación** haciendo click en un usuario
6. **Enviar mensajes** escribiendo y presionando Enter o el botón de enviar

### Funcionalidades del chat

- **Badge de notificaciones**: Muestra el número de mensajes no leídos
- **Lista de conversaciones**: Ver todas las conversaciones activas ordenadas por fecha
- **Búsqueda de usuarios**: Encontrar usuarios por nombre o email
- **Mensajes en tiempo real**: Los mensajes se reciben instantáneamente sin recargar
- **Marcado de lectura**: Los mensajes se marcan automáticamente como leídos al abrir una conversación
- **Minimizar**: Opción para minimizar el chat manteniendo las notificaciones visibles

## 🔧 API Endpoints

### Autenticación
Todos los endpoints requieren el parámetro `userId` en query string o header `x-user-id`.

### Endpoints disponibles

```
GET    /api/chat/users                    - Obtener usuarios disponibles
GET    /api/chat/conversations             - Obtener conversaciones del usuario
GET    /api/chat/messages/:otherUserId     - Obtener mensajes con otro usuario
POST   /api/chat/messages                  - Enviar un mensaje
PUT    /api/chat/messages/read/:otherUserId - Marcar mensajes como leídos
GET    /api/chat/unread                    - Obtener conteo de no leídos
DELETE /api/chat/conversations/:otherUserId - Eliminar conversación
GET    /api/chat/search?q=query            - Buscar usuarios
```

### Ejemplo de envío de mensaje

```javascript
POST /api/chat/messages?userId=123
Content-Type: application/json

{
  "receiverId": 456,
  "message": "Hola, ¿cómo estás?"
}
```

## 🎨 Personalización

### Colores del chat

Para cambiar los colores del chat, edita las variables CSS en `ChatWidget.vue`:

```css
/* Gradiente principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Puedes cambiar a otros colores, por ejemplo: */
background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
```

### Tamaño de la ventana

```css
.chat-widget__window {
  width: 360px;  /* Ancho */
  height: 500px; /* Alto */
}
```

## 🔐 Seguridad

### Mejoras recomendadas para producción

1. **Implementar JWT real**: Actualmente el sistema usa un método simple de autenticación. Deberías:
   - Validar el JWT en el middleware `requireAuth`
   - Extraer el `userId` del token validado
   - Evitar pasar `userId` como parámetro en la URL

2. **Rate limiting**: Agregar límites de tasa para evitar spam

3. **Sanitización de mensajes**: Validar y sanitizar el contenido de los mensajes

4. **Cifrado**: Considerar cifrado end-to-end para mensajes sensibles

## 📱 Eventos en Tiempo Real

El sistema utiliza Server-Sent Events (SSE) para actualizaciones en tiempo real:

### Eventos disponibles

- `chat:message` - Nuevo mensaje recibido
- `chat:read` - Mensajes marcados como leídos
- `ping` - Mantener la conexión activa

### Conexión SSE

```javascript
const eventSource = new EventSource('/realtime?channel=chat&userId=123');

eventSource.addEventListener('chat:message', (event) => {
  const message = JSON.parse(event.data);
  // Manejar nuevo mensaje
});
```

## 🐛 Troubleshooting

### El chat no aparece
- Verifica que el usuario esté autenticado
- Revisa la consola del navegador para errores
- Confirma que el servidor esté corriendo

### Los mensajes no se envían
- Verifica la conexión a la API
- Revisa que las tablas de base de datos estén creadas correctamente
- Confirma que el `userId` sea válido

### Mensajes no se reciben en tiempo real
- Verifica que la conexión SSE esté activa
- Revisa la configuración de CORS
- Confirma que el endpoint `/realtime` esté funcionando

## 🎯 Próximas Mejoras

- [ ] Notificaciones de escritura ("está escribiendo...")
- [ ] Envío de archivos e imágenes
- [ ] Mensajes de voz
- [ ] Reacciones a mensajes (emojis)
- [ ] Mensajes de grupo
- [ ] Búsqueda dentro de conversaciones
- [ ] Soporte para móviles (responsive mejorado)
- [ ] Indicadores de entrega y lectura más detallados
- [ ] Cifrado end-to-end

## 📄 Licencia

Este módulo es parte del sistema DigitalTex.
