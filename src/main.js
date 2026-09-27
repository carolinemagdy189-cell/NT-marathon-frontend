import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

/*
|-----------------------------------------------------------------------------
| Startup authentication flow
|-----------------------------------------------------------------------------
| The router's beforeEach guard restores any persisted session via
| GET /auth/me (the backend source of truth) BEFORE the first route renders,
| so refreshing a protected page never bounces a valid session to /login.
| main.js stays intentionally simple — no duplicate /auth/me calls here.
*/
const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
