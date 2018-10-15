import Vue from 'vue'

import App from './App'
import router from './router'
import store from './store'
import db from './db'

require('./config/vue')

db.init().then(() => {
  /* eslint-disable no-new */
  new Vue({
    components: { App },
    router,
    store,
    template: '<App/>',
  }).$mount('#app')
})
