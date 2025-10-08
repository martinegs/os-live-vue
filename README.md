# DigitalTex Ops Dashboard

Panel de monitoreo en tiempo real para las órdenes de trabajo de DigitalTex. La app consume la API existente y se actualiza mediante Server-Sent Events para que la operación tenga siempre la misma información que el backend.

## Características
- Stream en vivo con merge incremental mediante `useOrdersLive`.
- Búsqueda instantánea y paginado progresivo con carga bajo demanda.
- Editor contextual para crear/actualizar órdenes sin abandonar el panel.
- Tablero de métricas con distribución por estado y forma de pago.
- Diseño adaptable pensado para escritorio, tablet y móvil.

## Primeros pasos
```bash
npm install
npm run dev
```
Vite levantará el frontend en `http://localhost:5173`. El componente `OrdersLive` detecta si corre en localhost y, en ese caso, usa directamente los endpoints públicos (`https://digitaltex.ar/...`). En producción se esperan proxys relativos (`/api/os`, `/realtime/stream?...`).

| Script            | Descripción                                   |
|-------------------|-----------------------------------------------|
| `npm run dev`     | Desarrollo con HMR de Vite.                    |
| `npm run build`   | Compila la aplicación lista para producción.   |
| `npm run preview` | Sirve la build de producción para verificación |

## Estructura relevante
- `src/components/OrdersLive.vue`: capa de presentación del panel principal.
- `src/composables/orders/useOrdersLive.js`: estado reactivo + SSE + métricas.
- `src/components/orders/`: tabla, modal, toolbar e insights reutilizables.
- `src/components/RightMenu.vue`: navegación lateral y status del sistema.

## Personalización
- Ajustá los endpoints (API, SSE, create/update) pasando overrides a `useOrdersLive` si el backend cambia de host.
- `OrdersInsights` expone props para formatear moneda, por lo que podés internacionalizar el panel desde el componente padre.
- Para agregar nuevas secciones en la barra lateral basta con sumar objetos al arreglo `sections` en `RightMenu.vue`.

## Notas de desarrollo
- El proyecto usa `type: module`, por lo que los scripts de Node auxiliares deben terminar en `.cjs` o usar import/export.
- En Windows puede ser necesario habilitar la ejecución de scripts para correr `npm run build` desde PowerShell (`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`).

# os-live-vue
