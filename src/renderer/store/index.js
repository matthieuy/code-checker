import Vue from 'vue'
import Vuex from 'vuex'
import localStore from './local'

import types from './types'
import getters from './getters'
import mutations from './mutations'
import actions from './actions'

Vue.use(Vuex)

const state = {
  projects: [],
  selectedProject: {},
}

// Exports
export { types, localStore }
export default new Vuex.Store({
  state,
  getters,
  mutations,
  actions,
  strict: process.env.NODE_ENV !== 'production',
})
