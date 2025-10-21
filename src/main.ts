import { createApp } from 'vue'
import { Quasar } from 'quasar'
import { router } from './router'
import App from './App.vue'

// Import Quasar css
import 'quasar/dist/quasar.css'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

const app = createApp(App)

app.use(Quasar, {
  plugins: {}
})

app.use(router)

app.mount('#app')
