<template>
  <div class="app-shell">
    <OrdersLive />
  </div>
</template>

<script setup>
import OrdersLive from "./components/OrdersLive.vue";
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
  box-sizing: border-box;
  background: radial-gradient(circle at top left, rgba(129, 140, 248, 0.2), transparent),
              radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.18), transparent),
              #0b1020;
}

@media (max-width: 1100px) {
  .app-shell {
    flex-direction: column;
    align-items: stretch;
    padding: 32px 18px;
  }
}

@media (max-width: 768px) {
  .app-shell {
    padding: 24px 12px 32px;
  }
}

@media (max-width: 600px) {
  .app-shell {
    padding: 20px 12px 24px;
  }
}
</style>
