# DigitalTex Ops Dashboard

Panel de monitoreo en tiempo real para las ordenes de trabajo de DigitalTex. El proyecto combina un frontend Vue + Vite y un backend Express que reemplaza los endpoints PHP existentes utilizando la misma base de datos MySQL.

## Caracteristicas
- Stream en vivo con merge incremental mediante `useOrdersLive`.
- Busqueda instantanea y paginado progresivo con carga bajo demanda.
- Editor contextual para crear o actualizar ordenes sin abandonar el panel.
- Tablero de metricas con distribucion por estado y forma de pago.
- Backend Express conectado a MySQL y con soporte para Server-Sent Events.

## Primeros pasos
```bash
npm install

# Opcional: variables de entorno
cp .env.example .env

npm run dev    # levanta frontend (http://localhost:3000) y backend (http://localhost:4000)
```

Tambien podes iniciar solo uno de los servicios:

```bash
npm run dev:client   # solo Vite
npm run dev:api      # solo Express + SSE
```

El frontend detecta si corre en localhost y, salvo que definas `VITE_API_ORIGIN`, hablara con `http://localhost:4000`. En produccion los endpoints son relativos (`/api/os`, `/realtime/stream?...`).

| Script             | Descripcion                                       |
|--------------------|---------------------------------------------------|
| `npm run dev`      | Levanta frontend y backend en paralelo.           |
| `npm run dev:client`| Solo frontend con HMR de Vite.                    |
| `npm run dev:api`  | Solo backend Express (nodemon + SSE).             |
| `npm run build`    | Compila la aplicacion para produccion.            |
| `npm run preview`  | Sirve la build de produccion para verificacion.   |

## Backend Express
- `server/index.js`: API REST + SSE montada sobre MySQL (`mysql2/promise`).
  - `GET /api/os` -> listado completo de ordenes.
  - `POST /api/os` -> crea una orden y emite evento `insert`.
  - `GET /api/os/:id` -> obtiene una orden especifica.
  - `PUT /api/os/:id` -> actualiza una orden y emite evento `update`.
  - `GET /realtime/stream?channel=os` -> stream SSE consumido por el panel.
  - `GET /health` -> verificacion rapida de la conexion y metadatos.
- La conexion usa pool y parametros configurables por entorno.
- Si tu tabla difiere del mapeo por defecto, ajusta `MYSQL_ORDERS_TABLE` y/o los campos en `server/index.js`.

### Variables de entorno
Se leen automaticamente desde `.env` (gracias a `dotenv`). Valores por defecto entre parentesis:

```
PORT=4000
MYSQL_HOST=srv1526.hstgr.io
MYSQL_USER=u371726528_dtex
MYSQL_PASSWORD=@hnc|I*]GN0
MYSQL_DATABASE=u371726528_dtex
MYSQL_CHARSET=utf8mb4
MYSQL_POOL_LIMIT=10
MYSQL_ORDERS_TABLE=os
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
# MYSQL_ACTIVITY_TS_COLUMN=activity_ts   # opcional, descomenta si tu tabla incluye esta columna
VITE_API_ORIGIN=http://localhost:4000    # opcional para el frontend
```

Nota: para ambientes productivos defini estos valores via variables de entorno y evita dejar credenciales en claro.

## Frontend relevante
- `src/components/OrdersLive.vue`: capa de presentacion del panel.
- `src/composables/orders/useOrdersLive.js`: estado reactivo, SSE y metricas derivadas.
- `src/components/orders/`: tabla, modal, toolbar e insights reutilizables.

### Configuracion adicional
- `VITE_API_ORIGIN` (opcional): host base del backend si no queres depender de la deteccion automatica.
- `CORS_ORIGINS` (opcional): lista separada por comas con los origenes habilitados para CORS/SSE.
- `vite.config.js` fija el servidor dev de Vite en el puerto `3000`; cambialo si ya esta ocupado.

## Notas de desarrollo
- El proyecto usa `type: module`, por lo que scripts auxiliares de Node deben usar import/export o la extension `.cjs`.
- En Windows quiza debas habilitar la ejecucion de scripts para `npm run build` o `npm run dev:api`: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.
- Los eventos SSE se emiten unicamente desde los endpoints de creacion/actualizacion. Si aplicas cambios por fuera de Express (por ejemplo tareas en background), emiti el evento manualmente o implementa otra estrategia (triggers, colas, etc.).

# os-live-vue


