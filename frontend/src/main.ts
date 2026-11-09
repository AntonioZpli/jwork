import './assets/main.css'
import './assets/candidate-theme.css'
import './assets/workspace-theme.css'
import './assets/admin/profile.css'
import './assets/admin/retro.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

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
}

function resetLandingScroll() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

if (enteringLanding) {
  router.isReady().then(() => {
    resetLandingScroll()
    let frames = 0
    const resetAfterRender = () => {
      resetLandingScroll()
      frames += 1
      if (frames < 3) window.requestAnimationFrame(resetAfterRender)
    }
    window.requestAnimationFrame(resetAfterRender)
    window.setTimeout(() => {
      resetLandingScroll()
    }, 100)
  })
  window.addEventListener('pageshow', () => {
    resetLandingScroll()
  }, { once: true })
}
