import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/reset.css'

const app = createApp(App)

declare global {
  interface Window {
    CESIUM_BASE_URL: string
  }
}

app.use(createPinia())
app.use(router)

app.mount('#app')
