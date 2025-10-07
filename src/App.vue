<template>
  <div class="app-shell">
    <div class="main-pane">
      <OrdersLive />
    </div>
    <RightMenu />
  </div>
</template>

<script setup>
import OrdersLive from "./components/OrdersLive.vue";
import RightMenu from "./components/RightMenu.vue";
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 32px;
  padding: 40px;
  box-sizing: border-box;
  background: radial-gradient(circle at top left, rgba(129, 140, 248, 0.2), transparent),
              radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.18), transparent),
              #0b1020;
}

.main-pane {
  flex: 0 1 1100px;
  display: flex;
  justify-content: center;
}

@media (max-width: 1100px) {
  .app-shell {
    flex-direction: column;
    align-items: center;
    padding: 24px;
  }
}
</style>
