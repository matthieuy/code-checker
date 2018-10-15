<template>
  <div id="app">
    <div class="window">
      <header class="toolbar toolbar-header">
        <div class="toolbar-actions">
          <div class="btn-group">
            <router-link
              :to="{name: 'homepage'}"
              class="btn btn-default"
              :class="{active: $route.name === 'homepage'}"
              v-tooltip="'Projets'"
              >
                <i class="fa fa-home"></i>
            </router-link>
          </div>

          <div class="btn-group" v-if="selectedProject._id">
            <router-link
              :to="{name: 'sniffer', params: { id: selectedProject._id }}"
              class="btn btn-default"
              :class="{active:  $route.name === 'sniffer'}"
              v-tooltip="'Syntaxe PHP'"
              >
                <i class="fa fa-code"></i>
            </router-link>
            <router-link
              :to="{name: 'md', params: { id: selectedProject._id }}"
              class="btn btn-default"
              :class="{active:  $route.name === 'md'}"
              v-tooltip="'Qualité du code'"
              >
                <i class="fa fa-microscope"></i>
            </router-link>

            <router-link
              :to="{name: 'copy', params: { id: selectedProject._id }}"
              class="btn btn-default"
              :class="{active: $route.name === 'copy'}"
              v-tooltip="'Code dupliqué'"
              >
                <i class="fa fa-paste"></i>
            </router-link>
          </div>

          <div class="btn-group pull-right">
            <button class="btn btn-default" v-show="isDev" @click="devTools()" :class="{active: devToolsOpen}">
              <i class="fa fa-bug"></i>
            </button>
            <button class="btn btn-default cursor" @click="quit()" v-tooltip="'Quitter'">
              <i class="fa fa-power-off"></i>
            </button>
          </div>
        </div>
      </header>

      <div class="window-content">
        <router-view>&nbsp;</router-view>
      </div>
    </div>
  </div>
</template>

<script>
  import { remote, ipcRenderer } from 'electron'
  import { mapState } from 'vuex'
  import { types, localStore } from './store'

  export default {
    data () {
      return {
        devToolsOpen: false,
        isDev: false,
      }
    },
    computed: {
      ...mapState([
        'selectedProject',
      ]),
    },
    methods: {
      /**
       * Toggle devtools
       */
      devTools () {
        let currentWebContent = remote.getCurrentWindow().webContents
        this.devToolsOpen = !currentWebContent.isDevToolsOpened()
        currentWebContent.toggleDevTools()
      },
      /**
       * Quit app
       */
      quit () {
        remote.app.quit()
      },
    },
    watch: {
      devToolsOpen (value) {
        localStore.set(localStore.KEY.DEVTOOLS.OPEN, value)
      },
    },
    mounted () {
      console.info('[VUE] Mount App.vue')

      // Dev tools
      if (process.env.NODE_ENV === 'development') {
        this.isDev = true
        this.devToolsOpen = remote.getCurrentWindow().webContents.isDevToolsOpened()
        remote.getCurrentWebContents().on('devtools-opened', () => { this.devToolsOpen = true })
        remote.getCurrentWebContents().on('devtools-closed', () => { this.devToolsOpen = false })
      }

      // Load project
      this.$store.dispatch(types.ACTIONS.PROJECTS_LOAD).then((projects) => {
        console.log('Load projects', projects)
      })

      window.ondragstart = () => { return false } // Disable drag
      ipcRenderer.send('app-ready') // App ready
      ipcRenderer.on('change-load', (event, load) => {
        if (load) {
          document.getElementsByTagName('body')[0].classList.add('app-load')
        } else {
          document.getElementsByTagName('body')[0].classList.remove('app-load')
        }
      })
    },
  }
</script>

<style lang="scss">
  @import "assets/scss/theme";

  // Loading
  body.app-load {
    cursor: progress !important;
    .cursor {
      cursor: progress !important;
    }
  }
</style>
