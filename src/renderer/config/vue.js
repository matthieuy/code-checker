import moment from 'moment'
import Vue from 'vue'
import VueContextMenu from 'vue-context-menu'
import VueTooltip from 'v-tooltip'
import VueHighlightJS from '../tools/Highlight'

// Config VueJS
if (!process.env.IS_WEB) {
  Vue.use(require('vue-electron'))
}
if (process.env.NODE_ENV !== 'production') {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = true
}
Vue.config.productionTip = false
Vue.use(VueContextMenu)
Vue.use(VueTooltip)
Vue.use(VueHighlightJS)
moment.locale('fr')

/**
 * VueJS filters
 */
Vue.filter('defaut', (value, defaultValue) => {
  return (typeof value === 'undefined' || value === null) ? defaultValue : value
})

Vue.filter('plurialize', (value, singular, plurial) => {
  if (typeof value === 'undefined') {
    return plurial
  }
  return (value <= 1) ? `${value} ${singular}` : `${value} ${plurial}`
})

Vue.filter('formatDate', (value, format) => {
  if (typeof value === 'undefined' || !value) {
    return ''
  }
  let date = moment(value)
  return (date.isValid()) ? 'le ' + date.format(format) : ''
})
