import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
  routes: [
    // Homepage
    {
      path: '/',
      name: 'homepage',
      component: require('@/components/Projects').default,
    },
    // PHPCS
    {
      path: '/sniffer/:id',
      name: 'sniffer',
      component: require('@/components/CodeSniffer').default,
    },
    // PHPMD
    {
      path: '/md/:id',
      name: 'md',
      component: require('@/components/MessDetector').default,
    },
    // PHPCPD
    {
      path: '/copy/:id',
      name: 'copy',
      component: require('@/components/CopyPaste').default,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
})
