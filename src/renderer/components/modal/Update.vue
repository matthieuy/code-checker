<template>
    <div id="modal">
        <div class="drag"></div>
        <div class="close" @click="close()">&times;</div>
        <h1 class="text-center">Quoi de neuf ?</h1>
    </div>
</template>

<script>
    import { remote, ipcRenderer } from 'electron'

    export default {
      data () {
        return {
          releases: [],
          version: remote.app.getVersion(),
          percent: 0,
          speed: 0,
          isInstalling: false,
        }
      },
      methods: {
        /**
         * Close the modal
         */
        close () {
          remote.getCurrentWindow().close()
        },
      },
      mounted () {
        console.log('[VUE] Mount modal/Update.vue')

        // IPC download progress
        ipcRenderer.on('progress-update', (event, percent, speed) => {
          this.percent = percent
          this.speed = speed
        })

        // IPC Start install
        ipcRenderer.on('start-install', () => {
          this.isInstalling = true
          this.percent = 0
        })

        // IPC receive release list
        ipcRenderer.on('list-releases', (event, releases) => {
          console.log('Releases', releases)
          this.release = releases
        })
      },
    }
</script>

<style lang="scss">
    @import "../../assets/scss/vars";
    @import "../../assets/scss/scrollbar";
    @import "../../assets/scss/photon/global";
    @import "../../assets/scss/photon/buttons";

    #modal {
        color: $txtColor;
        a {
            color: #FFF;
            font-weight: bold;
        }
        h1 {
            margin: 0 20px;
            -webkit-app-region: drag;
        }

        .close {
            position: absolute;
            z-index: 5;
            top: 0;
            right: 0;
            padding: 0 3px;
            font-size: 28px;
            line-height: 20px;
            cursor: pointer;
        }
        .drag {
            position: absolute;
            top: 0;
            left: 0;
            height: 15px;
            width: calc(100% - 20px);
            -webkit-app-region: drag;
        }
    }
</style>
