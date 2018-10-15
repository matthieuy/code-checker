import Vue from 'vue'

import Modal from './ModalWindow'
import router from './router/modal-router'

new Vue({
  components: { Modal },
  router,
  template: '<Modal/>',
}).$mount('#app')
