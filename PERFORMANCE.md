# Optimizaciones de Rendimiento para PCs de Bajos Recursos

Este documento detalla las optimizaciones implementadas para que la aplicación funcione correctamente en equipos con recursos limitados.

## Detección Automática de Dispositivos

La aplicación detecta automáticamente si el dispositivo tiene recursos limitados mediante:

- **Núcleos del procesador**: Menos de 4 núcleos
- **Memoria RAM**: Menos de 4 GB
- **Preferencias del sistema**: `prefers-reduced-motion`

## Optimizaciones Aplicadas

### 1. Animaciones Reducidas

#### Estrellas Fugaces Globales
- **Antes**: 12 gradientes radiales animándose cada 8 segundos
- **Ahora**: 5 gradientes radiales animándose cada 12 segundos
- **Reducción**: 58% menos gradientes, 50% más lento

#### Estrellas del Botón de Chat
- **Antes**: 7 gradientes radiales animándose cada 3 segundos con cambios de opacidad
- **Ahora**: 3 gradientes radiales animándose cada 6 segundos sin cambios de opacidad
- **Reducción**: 57% menos gradientes, 100% más lento

#### Gráficos de Metros Vendidos
- **Antes**: Gradiente animado con efecto shimmer (3 animaciones simultáneas)
- **Ahora**: Gradiente estático con transición simple
- **Reducción**: 2 animaciones eliminadas

### 2. Efectos Visuales Simplificados

#### Box-Shadow y Text-Shadow
- Reducción de múltiples sombras superpuestas a una sola sombra
- Disminución de valores de blur de 30px a 15px
- Menor intensidad de glow effects (de 0.6 a 0.4)

#### Badges y Elementos Pulsantes
- Animaciones de pulse eliminadas o simplificadas
- Menos keyframes por animación

### 3. Optimización de Renderizado

#### will-change Property
Añadido a elementos que se animan frecuentemente:
```css
.element {
  will-change: background-position; /* o transform, opacity */
}
```

Esto indica al navegador que optimice estos elementos en capas de GPU.

### 4. Media Query para Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Respeta las preferencias de accesibilidad del usuario.

### 5. Clase CSS para Dispositivos de Bajos Recursos

Cuando se detecta un dispositivo de bajos recursos, se añade la clase `.low-end-device`:

```css
.low-end-device #app::before {
  animation-duration: 20s !important;
  opacity: 0.2 !important;
}

.low-end-device .stats-bar__fill,
.low-end-device .chat-manager__trigger::before {
  animation: none !important;
}
```

## Archivos Modificados

### Nuevos Archivos
- `src/config/performance.js` - Detección y configuración de rendimiento

### Archivos Optimizados
- `src/assets/main.css` - Animaciones globales y media queries
- `src/components/StatsDashboard.vue` - Gráficos simplificados
- `src/components/ChatManager.vue` - Botón de chat optimizado
- `src/main.js` - Integración de detección de rendimiento

## Resultados Esperados

### En Dispositivos de Bajos Recursos
- ✅ Reducción del 60-70% en uso de CPU por animaciones
- ✅ Menor consumo de memoria RAM
- ✅ Interfaz más fluida y responsive
- ✅ Tiempo de carga reducido

### En Dispositivos de Alto Rendimiento
- ✅ Mantiene efectos visuales completos
- ✅ Experiencia visual mejorada
- ✅ Animaciones suaves y atractivas

## Pruebas de Rendimiento

Para probar en modo de bajos recursos manualmente:

1. **Chrome DevTools**:
   - F12 → Performance → Settings (⚙️)
   - CPU: 4x o 6x slowdown
   - Network: Fast 3G

2. **Firefox DevTools**:
   - F12 → Network → Throttling
   - Performance → Simular CPU lenta

3. **Preferencias del Sistema**:
   - Windows: Configuración → Accesibilidad → Animaciones
   - macOS: Preferencias → Accesibilidad → Reducir movimiento

## Monitoreo

La aplicación registra en consola el tipo de dispositivo detectado:

```
[Performance] Dispositivo de bajos recursos detectado - Aplicando optimizaciones
```

o

```
[Performance] Dispositivo de alto rendimiento - Usando animaciones completas
```

## Futuras Optimizaciones Potenciales

1. **Lazy Loading**: Cargar componentes bajo demanda
2. **Virtual Scrolling**: Para tablas con muchas filas
3. **Image Optimization**: Usar WebP y lazy loading
4. **Code Splitting**: Dividir el bundle en chunks más pequeños
5. **Service Worker**: Cacheo de recursos estáticos

## Compatibilidad

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Soporte

Para reportar problemas de rendimiento, incluir:
- Navegador y versión
- Sistema operativo
- Specs del equipo (RAM, CPU)
- Consola del navegador (F12)
