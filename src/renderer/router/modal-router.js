import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      name: 'splashscreen',
      path: '/splashscreen',
      component: require('@/components/modal/SplashScreen').default,
    },
    {
      name: 'about',
      path: '/about',
      component: require('@/components/modal/About').default,
    },
    {
      name: 'update',
      path: '/update',
      component: require('@/components/modal/Update').default,
    },
  ],
})

export default router
