<template>
  <section class="attendance-card dt-card dt-card--glow">
    <header class="attendance-card__header">
      <div>
        <p class="attendance-card__kicker">Equipo</p>
        <h3 class="attendance-card__title">Asistencias</h3>
        <p v-if="attendanceDate" class="attendance-card__meta">
          Corte {{ attendanceDate }}
        </p>
      </div>
      <div v-if="attendanceSummary" class="attendance-card__summary">
        <span class="attendance-card__pill attendance-card__pill--present">
          {{ attendanceSummary.presentes }} presentes
        </span>
        <span class="attendance-card__pill attendance-card__pill--absent">
          {{ attendanceSummary.ausentes }} ausentes
        </span>
        <span class="attendance-card__pill">
          {{ attendanceSummary.totalUsuarios }} total
        </span>
      </div>
    </header>

    <div v-if="loading" class="attendance-card__state attendance-card__state--loading">
      <div class="attendance-card__spinner"></div>
      <p>Cargando asistencias...</p>
    </div>

    <div v-else-if="error" class="attendance-card__state attendance-card__state--error">
      <p>Oops, {{ error }}</p>
    </div>

    <div v-else-if="!hasUsers" class="attendance-card__state">
      <p>No hay usuarios con asistencia registrada.</p>
    </div>

    <ul v-else class="attendance-card__list">
      <li
        v-for="usuario in attendanceUsers"
        :key="usuario.id"
        class="attendance-card__item"
        :class="{
          'attendance-card__item--present': usuario.estado === 'Presente',
          'attendance-card__item--absent': usuario.estado !== 'Presente'
        }"
      >
        <span
          class="attendance-card__dot"
          :class="usuario.estado === 'Presente' ? 'attendance-card__dot--present' : 'attendance-card__dot--absent'"
        ></span>
        <span class="attendance-card__name">{{ usuario.nombre }}</span>
        <span class="attendance-card__time">
          {{ usuario.horaEntrada ?? "--" }}
        </span>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useDateTime } from "@/composables/useDateTime";

const { getCurrentDate } = useDateTime();

const props = defineProps({
  apiOrigin: {
    type: String,
    default: "",
  },
});

const attendanceData = ref(null);
const loading = ref(false);
const error = ref(null);

const attendanceUsers = computed(
  () => attendanceData.value?.usuarios ?? []
);

const attendanceSummary = computed(() => {
  if (!attendanceData.value) return null;
  return {
    presentes: attendanceData.value.presentes ?? 0,
    ausentes: attendanceData.value.ausentes ?? 0,
    totalUsuarios:
      attendanceData.value.totalUsuarios ?? attendanceUsers.value.length,
  };
});

const attendanceDate = computed(() => attendanceData.value?.date ?? null);
const hasUsers = computed(() => attendanceUsers.value.length > 0);

async function fetchAttendance() {
  loading.value = true;
  error.value = null;

  try {
    const origin = (props.apiOrigin || "").replace(/\/$/, "");
    const dateStr = getCurrentDate().toISOString().slice(0, 10);
    const url = `${origin}/api/attendance/daily?date=${encodeURIComponent(dateStr)}`;

    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || "sin detalle"}`);
    }

    const data = await response.json();
    attendanceData.value = data;
  } catch (err) {
    console.error("[AttendanceCard] Error al cargar asistencias:", err);
    error.value = "no logramos cargar los datos de asistencia";
  } finally {
    loading.value = false;
  }
}

onMounted(fetchAttendance);
</script>

<style scoped>
.attendance-card {
  gap: var(--dt-gap-md);
  min-height: 280px;
}

.attendance-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--dt-gap-md);
}

.attendance-card__kicker {
  margin: 0 0 4px;
  font-size: var(--dt-font-size-xs);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--dt-color-text-muted);
}

.attendance-card__title {
  margin: 0;
  font-size: var(--dt-font-size-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--dt-color-text-primary);
}

.attendance-card__meta {
  margin: 6px 0 0;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.attendance-card__summary {
  display: flex;
  flex-wrap: wrap;
  gap: var(--dt-gap-xs);
  justify-content: flex-end;
}

.attendance-card__pill {
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--dt-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--dt-color-text-secondary);
  background: rgba(148, 163, 184, 0.16);
  border: 1px solid rgba(148, 163, 184, 0.24);
}

.attendance-card__pill--present {
  color: var(--dt-color-success);
  border-color: rgba(34, 197, 94, 0.45);
  background: rgba(34, 197, 94, 0.16);
}

.attendance-card__pill--absent {
  color: var(--dt-color-danger);
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.14);
}

.attendance-card__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--dt-gap-sm);
  padding: 48px 0;
  color: var(--dt-color-text-secondary);
  text-align: center;
}

.attendance-card__state--error {
  color: var(--dt-color-danger);
}

.attendance-card__spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid rgba(148, 163, 184, 0.18);
  border-top-color: var(--dt-color-accent);
  animation: attendance-spin 1s linear infinite;
}

@keyframes attendance-spin {
  to {
    transform: rotate(360deg);
  }
}

.attendance-card__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 540px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.attendance-card__list::-webkit-scrollbar {
  width: 6px;
}

.attendance-card__list::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.2);
  border-radius: 999px;
}

.attendance-card__list::-webkit-scrollbar-thumb {
  background: rgba(255, 20, 147, 0.32);
  border-radius: 999px;
}

.attendance-card__item {
  display: flex;
  align-items: center;
  gap: var(--dt-gap-sm);
  padding: 10px 14px;
  border-radius: var(--dt-radius-sm);
  border: 1px solid rgba(255, 20, 147, 0.25);
  background: rgba(15, 10, 20, 0.58);
  box-shadow: 0 0 8px rgba(255, 20, 147, 0.08);
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.attendance-card__item:hover {
  transform: translateX(2px);
  border-color: rgba(255, 20, 147, 0.4);
  background: rgba(20, 10, 20, 0.7);
}

.attendance-card__item--present {
  border-left: 4px solid rgba(34, 197, 94, 0.6);
}

.attendance-card__item--absent {
  border-left: 4px solid rgba(239, 68, 68, 0.6);
}

.attendance-card__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-flex;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(255, 20, 147, 0.4);
}

.attendance-card__dot--present {
  background: var(--dt-color-success);
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.7);
}

.attendance-card__dot--absent {
  background: var(--dt-color-danger);
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.55);
}

.attendance-card__name {
  flex: 1;
  font-size: var(--dt-font-size-sm);
  font-weight: 500;
  color: var(--dt-color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.attendance-card__time {
  font-family: "JetBrains Mono", "Fira Mono", monospace;
  font-size: var(--dt-font-size-xs);
  color: var(--dt-color-text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

@media (max-width: 960px) {
  .attendance-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .attendance-card__summary {
    justify-content: flex-start;
  }
}
</style>
