<template>
    <div id="modal">
        <div class="drag"></div>
        <div class="close" @click="close()">&times;</div>
        <h1 class="text-center">Quoi de neuf ?</h1>
        <div class="infos">
            <div class="current">Version actuelle : v{{ version }}</div>
            <div class="text-center">
                <button class="btn btn-nav" v-show="versionAvailable && percent === 0 && !isInstalling" @click="startDownload()">Télécharger "<strong>CodeChecker v{{ versionAvailable }}</strong>"</button>
                <div id="progress" v-show="percent">
                    <div id="prg">
                        <div id="line" :style="`width: ${percent}%;`"></div>
                        <div id="txt">{{ percent }}% <span v-show="speed">({{ speed|size }}/s)</span></div>
                    </div>
                </div>
                <div v-show="isInstalling">Installation de la v{{ versionAvailable }} en cours...</div>
            </div>
        </div>
        <div class="updates">
            <div class="update" v-for="release in releases">
                <h3>v{{ release.version }} :</h3>
                <div class="note" v-html="release.note" @click="clickNote($event)"></div>
            </div>
            <div class="clearfix"></div>
        </div>
    </div>
</template>

<script>
    import { remote, shell, ipcRenderer } from 'electron'

    export default {
      data () {
        return {
          releases: [],
          version: remote.app.getVersion(),
          versionAvailable: false,
          percent: 0,
          speed: 0,
          isInstalling: false,
        }
      },
      methods: {
        /**
         * Start download last release
         */
        startDownload () {
          ipcRenderer.send('start-update')
        },
        /**
         * Clic on a release note
         * @param {Event} event
         */
        clickNote (event) {
          event.preventDefault()
          if (event.target.href) {
            shell.openExternal(event.target.href)
          }
        },
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
          this.releases = releases
          if (releases.length) {
            this.versionAvailable = releases[0].version
          }
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
        strong {
            font-weight: bold;
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
        .infos {
            .current {
                text-align: center;
                font-style: italic;
            }
            .btn {
                display: block;
                width: calc(100% - 10px);
                margin: 5px;
                font-size: 14px;
            }
        }
        .updates {
            position: absolute;
            top: 120px;
            bottom: 0;
            padding-bottom: 15px;
            overflow-y: auto;

            h3 {
                font-size: 2em;
                padding: 20px 0 0 10px;
                margin: 0;
                color: #FFF;
            }
            :first-child h3 {
                padding-top: 0;
            }
            p {
                margin-left: 7px;
            }
            ul {
                padding-left: 15px;
                margin-left: 10px;
            }
        }

        #progress {
            position: absolute;
            width: calc(100% - 20px);
            margin: 3px 10px;
            #prg {
                position: relative;
                height: 20px;
                margin-bottom: 20px;
                background-image: -webkit-linear-gradient($sidebarBorder, lighten($sidebarBorder, 10%));
                border: 1px solid lighten($sidebarBorder, 30%);
                border-radius: 2px;
                box-shadow: inset 0 1px 3px $sidebarBorder;
            }
            #line {
                width: 0;
                height: 19px;
                -webkit-transition: width 2s;
                background-image: -webkit-linear-gradient($navActiveBg, $navActiveColor);
                border-radius: 2px;
            }
            #txt {
                position: absolute;
                top: -1px;
                width: 100%;
                font-size: 14px;
                font-weight: 700;
                color: #FFFFFF;
                text-align: center;
            }
        }
    }
</style>
