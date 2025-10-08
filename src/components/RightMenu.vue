<template>
  <aside class="menu-shell">
    <header class="menu-header">
      <div class="logo-chip">
        <span>DT</span>
      </div>
      <div class="brand-info">
        <p class="brand">DigitalTex Ops</p>
        <p class="tagline">Monitoreo en tiempo real</p>
      </div>
    </header>

    <section class="glitch-bar">
      <span class="pulse-dot" aria-hidden="true"></span>
      <span class="glitch-text">SISTEMA EN LÍNEA</span>
    </section>

    <section class="status-cards">
      <div class="card">
        <p class="card-label">Turno</p>
        <p class="card-value">Activo</p>
      </div>
      <div class="card">
        <p class="card-label">Alertas</p>
        <p class="card-value warn">03</p>
      </div>
      <div class="card">
        <p class="card-label">Usuarios</p>
        <p class="card-value">18</p>
      </div>
    </section>

    <nav class="nav-block">
      <ul class="nav-list">
        <li
          v-for="section in sections"
          :key="section.id"
          class="nav-item"
        >
          <component
            :is="section.children ? 'button' : 'a'"
            class="nav-link"
            :class="{ open: isOpen(section.id), nested: !!section.children }"
            :type="section.children ? 'button' : undefined"
            :href="section.link || undefined"
            @click="section.children ? toggle(section.id) : undefined"
          >
            <span class="icon" aria-hidden="true">{{ section.icon }}</span>
            <span class="text">{{ section.label }}</span>
            <span v-if="section.children" class="caret" aria-hidden="true">
              {{ isOpen(section.id) ? "▼" : "►" }}
            </span>
          </component>

          <transition name="submenu">
            <ul
              v-if="section.children && isOpen(section.id)"
              class="submenu"
            >
              <li
                v-for="item in section.children"
                :key="item.id"
                class="submenu-item"
              >
                <a class="submenu-link" :href="item.link || '#'">
                  {{ item.label }}
                </a>
              </li>
            </ul>
          </transition>
        </li>
      </ul>
    </nav>
  </aside>
</template>

<script setup>
import { reactive } from "vue";

// Static navigation blueprint; allows the view to stay declarative and avoids hardcoding markup.
const sections = [
  { id: "panel", label: "Panel", icon: "⌂" },
  {
    id: "clientes",
    label: "Clientes",
    icon: "👥",
    children: [
      { id: "clientes-lista", label: "Clientes" },
      { id: "clientes-contactos", label: "Contactos" },
      { id: "clientes-descuentos", label: "Descuentos" },
      { id: "clientes-360", label: "360°" },
      { id: "clientes-stock", label: "Stock" },
    ],
  },
  { id: "proveedores", label: "Proveedores", icon: "🏢" },
  { id: "productos", label: "Productos", icon: "🧵" },
  { id: "servicios", label: "Servicios", icon: "🛠️" },
  {
    id: "actividades",
    label: "Actividades",
    icon: "📈",
    children: [
      { id: "actividades-logs", label: "Logs Clientes" },
      { id: "actividades-movimientos", label: "$ Movimientos" },
    ],
  },
  {
    id: "ordenes",
    label: "Órdenes de Trabajo",
    icon: "🧾",
    children: [
      { id: "ordenes-gerenciar", label: "Gerenciar" },
      { id: "ordenes-temporales", label: "Órdenes temporales" },
      { id: "ordenes-errores", label: "Órdenes con errores" },
      { id: "ordenes-jornadas", label: "Reporte Jornadas" },
      { id: "ordenes-rollos", label: "Rollos / Hot metros" },
    ],
  },
  {
    id: "financiero",
    label: "Financiero",
    icon: "💰",
    children: [
      { id: "financiero-comunicados", label: "Comunicados" },
      { id: "financiero-ganancias", label: "Ganancias" },
      { id: "financiero-adeuda", label: "Adeuda" },
      { id: "financiero-mp", label: "Mercado Pago" },
      { id: "financiero-pagos", label: "Pagos procesados" },
    ],
  },
  {
    id: "informes",
    label: "Informes",
    icon: "📋",
    children: [
      { id: "informes-financiero", label: "Financiero" },
      { id: "informes-360", label: "360°" },
    ],
  },
  { id: "porcentajes", label: "Informe Porcentajes", icon: "⚖️" },
  { id: "productos-clientes", label: "Productos Clientes", icon: "📦" },
  { id: "categorias-estampados", label: "Categorías Estampados", icon: "🎨" },
  { id: "estampados", label: "Estampados", icon: "🖼️" },
  {
    id: "auditorias",
    label: "Auditorías",
    icon: "🔍",
    children: [
      { id: "auditorias-productos", label: "Productos eliminados" },
      { id: "auditorias-adelantos", label: "Adelantos clientes" },
    ],
  },
  {
    id: "configuraciones",
    label: "Configuraciones",
    icon: "⚙️",
    children: [
      { id: "configuraciones-usuarios", label: "Usuarios" },
      { id: "configuraciones-empresa", label: "Empresa" },
      { id: "configuraciones-ofertas", label: "Ofertas" },
      { id: "configuraciones-comisiones", label: "Comisiones" },
      { id: "configuraciones-permisos", label: "Permisos" },
      { id: "configuraciones-horarios", label: "Horarios / Tardanzas" },
      { id: "configuraciones-qr", label: "QR / Adelantos" },
      { id: "configuraciones-backup", label: "Backup" },
    ],
  },
  {
    id: "accesos-directos",
    label: "Accesos directos",
    icon: "⚡",
    children: [
      { id: "accesos-asistencias", label: "Asistencias" },
      { id: "accesos-gastos", label: "Gastos" },
    ],
  },
];

const openState = reactive({});

// Basic accordion state so each submenu can expand independently.
function isOpen(id) {
  if (openState[id] === undefined) {
    openState[id] = false;
  }
  return openState[id];
}

function toggle(id) {
  openState[id] = !isOpen(id);
}
</script>

<style scoped>
.menu-shell {
  width: 360px;
  padding: 28px 24px;
  border-radius: 18px;
  background:
    linear-gradient(135deg, rgba(94, 234, 212, 0.08), rgba(56, 189, 248, 0.05)),
    rgba(10, 16, 40, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow:
    0 20px 45px rgba(14, 165, 233, 0.18),
    0 0 0 1px rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #e2e8f0;
  position: sticky;
  top: 40px;
}

.menu-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-chip {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed, #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  letter-spacing: 1px;
  color: #fff;
  text-transform: uppercase;
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.6);
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.brand {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #f8fafc;
}

.tagline {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.8);
}

.glitch-bar {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: linear-gradient(90deg, rgba(168, 85, 247, 0.25), rgba(14, 165, 233, 0.08));
  border: 1px solid rgba(168, 85, 247, 0.35);
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.3em;
  font-size: 11px;
}

.glitch-bar::after {
  content: "";
  position: absolute;
  top: 0;
  left: -120%;
  width: 80%;
  height: 100%;
  background: linear-gradient(120deg, rgba(56, 189, 248, 0.0) 0%, rgba(56, 189, 248, 0.35) 50%, rgba(56, 189, 248, 0.0) 100%);
  animation: scanline 3.8s linear infinite;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px rgba(52, 211, 153, 0.9);
  animation: pulse 2s ease-in-out infinite;
}

.glitch-text {
  flex: 1;
}

.status-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.card {
  padding: 12px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(94, 234, 212, 0.15);
  text-align: center;
  box-shadow: inset 0 0 10px rgba(12, 74, 110, 0.35);
}

.card-label {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.2em;
  color: rgba(148, 163, 184, 0.75);
  text-transform: uppercase;
}

.card-value {
  margin: 4px 0 0;
  font-size: 16px;
  font-weight: 600;
}

.card-value.warn {
  color: #f59e0b;
}

.nav-block {
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 6px;
}

.nav-block::-webkit-scrollbar {
  width: 6px;
}

.nav-block::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 3px;
}

.nav-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: block;
}

.nav-link {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: inherit;
  text-decoration: none;
  font-size: 14px;
  transition: transform 0.15s ease, border 0.15s ease, background 0.15s ease;
}

.nav-link:hover {
  transform: translateX(4px);
  border-color: rgba(129, 140, 248, 0.55);
  background: rgba(37, 99, 235, 0.25);
}

.nav-link.nested {
  cursor: pointer;
}

.nav-link.open {
  border-color: rgba(236, 72, 153, 0.6);
  background: linear-gradient(90deg, rgba(236, 72, 153, 0.3), rgba(79, 70, 229, 0.25));
  box-shadow: 0 0 12px rgba(236, 72, 153, 0.2);
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: rgba(79, 70, 229, 0.28);
}

.text {
  flex: 1 1 auto;
  text-align: left;
}

.caret {
  font-size: 12px;
}

.submenu {
  list-style: none;
  margin: 8px 0 0;
  padding: 8px 0 0 18px;
  border-left: 1px solid rgba(148, 163, 184, 0.25);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.submenu-item {
  display: block;
}

.submenu-link {
  display: block;
  padding: 6px 10px;
  border-radius: 10px;
  text-decoration: none;
  color: rgba(226, 232, 240, 0.85);
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid transparent;
  transition: border 0.15s ease, transform 0.15s ease;
  font-size: 13px;
}

.submenu-link:hover {
  border-color: rgba(56, 189, 248, 0.4);
  transform: translateX(4px);
}

.submenu-enter-active,
.submenu-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.submenu-enter-from,
.submenu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 1100px) {
  .menu-shell {
    position: static;
    width: 100%;
    max-width: 680px;
  }
}

@media (max-width: 768px) {
  .menu-shell {
    padding: 22px 18px;
    gap: 20px;
  }

  .status-cards {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.85; }
  50% { transform: scale(1.3); opacity: 1; }
}

@keyframes scanline {
  0% { transform: translateX(0); }
  100% { transform: translateX(220%); }
}
</style>
