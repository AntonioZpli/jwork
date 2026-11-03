import './assets/main.css'
import './assets/admin/profile.css'
import './assets/admin/retro.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// A remembered landing-page fragment (for example #empresas) should not
// override the expected top-of-page entry after a reload.
const landingPath = new URL(import.meta.env.BASE_URL, window.location.origin).pathname
const enteringLanding = window.location.pathname === landingPath

if (enteringLanding) {
  window.history.scrollRestoration = 'manual'
  if (window.location.hash) {
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.search}`,
    )
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

if (enteringLanding) {
  router.isReady().then(() => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    })
  })
}
