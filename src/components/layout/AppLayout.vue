<template>
  <main class="app-layout">
    <div class="app-layout__content">
      <slot />
    </div>
  </main>
</template>

<style scoped>
.app-layout {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: var(--dt-gap-xl);
  box-sizing: border-box;
  display: flex;
  justify-content: center;
}

.app-layout__content {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--dt-gap-xl);
}

@media (max-width: 768px) {
  .app-layout {
    padding: var(--dt-gap-lg);
  }
}

@media (max-width: 520px) {
  .app-layout {
    padding: var(--dt-gap-md);
  }
}
</style>
