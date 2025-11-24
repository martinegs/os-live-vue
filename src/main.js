import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { applyPerformanceOptimizations } from './config/performance'

// Detectar y aplicar optimizaciones de rendimiento
applyPerformanceOptimizations();

createApp(App).mount('#app')
