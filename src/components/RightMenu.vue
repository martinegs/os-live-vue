<template>
  <div class="right-menu">
    <header class="right-menu__header">
      <div class="right-menu__brand">
        <span class="right-menu__mark">DT</span>
        <div>
          <p class="right-menu__title">DigitalTex Ops</p>
          <p class="right-menu__subtitle">Panel de operaciones</p>
        </div>
      </div>
      <span class="dt-pill right-menu__status">Sistema en linea</span>
    </header>

    <section class="right-menu__metrics">
      <article class="right-menu__card">
        <p class="right-menu__card-label">Turno</p>
        <p class="right-menu__card-value">Activo</p>
      </article>
      <article class="right-menu__card">
        <p class="right-menu__card-label">Alertas</p>
        <p class="right-menu__card-value right-menu__card-value--warn">03</p>
      </article>
      <article class="right-menu__card">
        <p class="right-menu__card-label">Usuarios</p>
        <p class="right-menu__card-value">18</p>
      </article>
      <button class="right-menu__action" type="button" @click="emit('open-login')">
        Iniciar sesion
      </button>
    </section>

    <nav class="right-menu__nav">
      <p class="dt-kicker">Secciones</p>
      <ul class="right-menu__list">
        <li v-for="section in sections" :key="section.id" class="right-menu__item">
          <component
            :is="section.children ? 'button' : 'a'"
            class="right-menu__link"
            :href="!section.children ? section.href : undefined"
            type="button"
            @click="section.children ? toggle(section.id) : undefined"
          >
            <span class="right-menu__dot">{{ section.short }}</span>
            <span class="right-menu__label">{{ section.label }}</span>
            <span v-if="section.children" class="right-menu__caret">
              {{ isOpen(section.id) ? 'v' : '>' }}
            </span>
          </component>

          <transition name="menu-fade">
            <ul v-if="section.children && isOpen(section.id)" class="right-menu__sub">
              <li v-for="item in section.children" :key="item.id">
                <a class="right-menu__sublink" :href="item.href ?? '#'">{{ item.label }}</a>
              </li>
            </ul>
          </transition>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref } from "vue";

const emit = defineEmits(["open-login"]);

const sections = [
  { id: "overview", label: "Panel general", short: "PG", href: "#" },
  {
    id: "clients",
    label: "Clientes",
    short: "CL",
    children: [
      { id: "clients-list", label: "Listado", href: "#" },
      { id: "clients-contacts", label: "Contactos", href: "#" },
      { id: "clients-discounts", label: "Descuentos", href: "#" },
    ],
  },
  { id: "providers", label: "Proveedores", short: "PR", href: "#" },
  { id: "products", label: "Productos", short: "PD", href: "#" },
  {
    id: "orders",
    label: "Ordenes de trabajo",
    short: "OT",
    children: [
      { id: "orders-manage", label: "Gestion en vivo", href: "#" },
      { id: "orders-pending", label: "Pendientes", href: "#" },
      { id: "orders-errors", label: "Con incidencias", href: "#" },
    ],
  },
  {
    id: "payments",
    label: "Pagos",
    short: "PG",
    children: [
      { id: "payments-today", label: "Pagos del dia", href: "#" },
      { id: "payments-history", label: "Historico", href: "#" },
    ],
  },
];

const openSections = ref(new Set());

function toggle(id) {
  const next = new Set(openSections.value);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  openSections.value = next;
}

function isOpen(id) {
  return openSections.value.has(id);
}
</script>

<style scoped>
.right-menu {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-lg);
  color: var(--dt-color-text-secondary);
}

.right-menu__header {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-md);
}

.right-menu__brand {
  display: flex;
  align-items: center;
  gap: var(--dt-gap-md);
}

.right-menu__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.08);
  color: var(--dt-color-text-primary);
  font-weight: 600;
  letter-spacing: 0.08em;
}

.right-menu__title {
  margin: 0;
  font-size: var(--dt-font-size-lg);
  color: var(--dt-color-text-primary);
  font-weight: 600;
}

.right-menu__subtitle {
  margin: 2px 0 0;
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-muted);
}

.right-menu__status {
  align-self: flex-start;
  background: rgba(34, 197, 94, 0.18);
  border: 1px solid rgba(34, 197, 94, 0.35);
  color: #4ade80;
}

.right-menu__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--dt-gap-md);
}

.right-menu__card {
  padding: var(--dt-gap-sm) var(--dt-gap-md);
  border-radius: var(--dt-radius-md);
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.6);
}

.right-menu__card-label {
  margin: 0;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
}

.right-menu__card-value {
  margin: 6px 0 0;
  font-size: var(--dt-font-size-lg);
  font-weight: 600;
  color: var(--dt-color-text-primary);
}

.right-menu__card-value--warn {
  color: var(--dt-color-warning);
}

.right-menu__action {
  grid-column: span 2;
  border: 1px solid var(--dt-color-accent);
  border-radius: var(--dt-radius-md);
  background: var(--dt-color-accent-soft);
  color: var(--dt-color-text-primary);
  font-weight: 500;
  padding: var(--dt-gap-sm) var(--dt-gap-md);
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.right-menu__action:hover {
  border-color: rgba(99, 102, 241, 0.6);
  transform: translateY(-2px);
}

.right-menu__action:focus-visible {
  outline: 2px solid var(--dt-color-accent);
  outline-offset: 2px;
}

.right-menu__nav {
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
}

.right-menu__list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-sm);
}

.right-menu__item {
  display: flex;
  flex-direction: column;
}

.right-menu__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--dt-gap-md);
  padding: var(--dt-gap-sm) var(--dt-gap-md);
  border-radius: var(--dt-radius-md);
  border: 1px solid transparent;
  background: rgba(15, 23, 42, 0.5);
  color: var(--dt-color-text-primary);
  cursor: pointer;
  text-align: left;
  text-decoration: none;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.right-menu__link:hover {
  border-color: var(--dt-color-border);
  background: rgba(15, 23, 42, 0.68);
}

.right-menu__dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.18);
  border: 1px solid rgba(99, 102, 241, 0.32);
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.12em;
}

.right-menu__label {
  flex: 1;
  font-size: var(--dt-font-size-sm);
  font-weight: 500;
}

.right-menu__caret {
  font-size: var(--dt-font-size-sm);
  color: var(--dt-color-text-muted);
}

.right-menu__sub {
  margin: var(--dt-gap-xs) 0 0;
  padding-left: 52px;
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-xs);
}

.right-menu__sublink {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--dt-font-size-xs);
  text-decoration: none;
  color: var(--dt-color-text-secondary);
  border-radius: 999px;
  padding: 6px 10px;
  transition: color 0.2s ease, background 0.2s ease;
}

.right-menu__sublink::before {
  content: '-';
  color: var(--dt-color-text-muted);
}

.right-menu__sublink:hover {
  background: rgba(99, 102, 241, 0.12);
  color: var(--dt-color-text-primary);
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
  transform-origin: top;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 920px) {
  .right-menu__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .right-menu__action {
    grid-column: span 3;
  }
}

@media (max-width: 520px) {
  .right-menu__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .right-menu__action {
    grid-column: span 2;
  }
}
</style>
