<template>
  <div class="detect-window">
    <div class="pane-group">
      <div class="pane-sm sidebar shows-sb">
        <nav class="nav-group">
          <h5 class="nav-group-title">Synthèse</h5>
          <span class="nav-group-item">
            <i class="fa fa-warning"></i>
            {{ result.length | defaut(0) | plurialize('alerte', 'alertes')}}
          </span>
        </nav>
        <nav class="nav-group">
          <h5 class="nav-group-title">Actions</h5>
          <div class="nav-group-item">
            <div class="btn btn-nav btn-action cursor" @click="runAnalyse()" v-tooltip="'Relancer une analyse'">
              <i class="fa fa-sync spinner-loading" :class="{'fa-spin': isLoading}"></i> Rafraichir
            </div>
          </div>
        </nav>
        <nav class="nav-group">
          <h5 class="nav-group-title">Dernière analyse</h5>
          <span class="nav-group-item" v-show="selectedProject.copyDate">{{ selectedProject.copyDate | formatDate('DD/M à HH:mm') }}</span>
          <span class="nav-group-item" v-show="!selectedProject.copyDate">Aucune</span>
        </nav>
      </div>
      <div class="pane">
        <div v-show="isLoading">
          <h2 class="text-center">
            <i class="fa fa-spin fa-spinner"></i> Analyse en cours...
          </h2>
        </div>
        <div v-if="!isLoading">
          <ul class="list-group list-files">
            <li class="list-group-header">
              <h1 class="text-center">Code dupliqué</h1>
              <p class="text-center" v-show="!noError && result.length">Il est recommandé de refactoriser le code pour éviter d'avoir du code dupliqué</p>
            </li>
            <li class="list-group-item text-center no-error" v-show="noError">
              <i class="fa fa-thumbs-up"></i> Félicitation ! Votre projet ne contient pas de code dupliqué !
            </li>
            <li
              class="list-group-item"
              v-for="(duplication, index) in result"
              :class="{ open: currentFile === index}"
              @contextmenu.prevent="$refs.FileCtx.$refs.ctx.open($event, duplication.file[0].attr.path)">
              <div class="cursor" @click="changeCurrentFile(index)">
                <div class="pull-left">
                  <div class="filename">{{ getFilename(duplication.file[0].attr.path) }}</div>
                  <div class="stats-file">
                    <span>
                      <i class="fa fa-warning"></i>
                      {{ duplication.attr.lines | plurialize('ligne copiée', 'lignes copiées') }}
                    </span>
                  </div>
                </div>
                <div class="pull-right"></div>
              </div>
              <div v-if="currentFile === index">
                <div class="message-report" v-for="(file, indexFile) in duplication.file">
                  <div class="header-message" @click="changeCurrentError(indexFile, file.attr.path, file.attr.line, duplication.attr.lines)">
                    <div class="pull-left">
                      {{ getFilename(file.attr.path) }}
                    </div>
                    <div class="pull-right">
                      <span class="line">Ligne {{ file.attr.line }}</span>
                    </div>
                  </div>
                  <div class="message-content" v-if="currentError === indexFile">
                    <pre v-highlightjs="extractCode"><code class="php" :data-line="file.attr.line" data-before="1"></code></pre>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <file-ctx ref="FileCtx" v-on:runanalyse="runAnalyse()">&nbsp;</file-ctx>
  </div>
</template>

<script>
  import { ipcRenderer, remote } from 'electron'
  import { mapState } from 'vuex'
  import { xml2json } from 'xml-js'
  import { types } from '../store'
  import { Cache, Project } from '../db'
  import FileCtx from './context/File'

  export default {
    components: {
      FileCtx,
    },
    data () {
      return {
        isLoading: false,
        result: [],
        noError: false,
        currentFile: null,
        currentError: null,
        extractCode: '',
      }
    },
    computed: {
      ...mapState([
        'selectedProject',
      ]),
      cacheId () {
        return 'phpcopy_' + this.selectedProject._id
      },
    },
    methods: {
      runAnalyse () {
        if (this.isLoading) {
          return false
        }
        this.isLoading = true
        ipcRenderer.send('phpcopy-cmd', this.selectedProject.toJSON())
      },
      /**
       * Change current file open
       * @param {String} file
       */
      changeCurrentFile (file) {
        this.currentError = null
        this.currentFile = (file === this.currentFile) ? '' : file
      },
      /**
       * Change current error open
       * @param {Integer} error
       * @param {String} filename
       * @param {Integer} start
       * @param {Integer|null} length
       */
      changeCurrentError (error, filename, start, length) {
        this.currentError = (error === this.currentError) ? null : error
        this.extractCode = ''
        if (this.currentError !== null) {
          this.$store.dispatch(types.ACTIONS.GET_LINES, {
            file: filename,
            start: start - 1,
            end: start + length - 1,
          }).then((result) => {
            this.extractCode = result
          })
        }
      },
      /**
       * Get the filename without project path
       * @param {String} filename
       * @return {String}
       */
      getFilename (filename) {
        return filename.replace(this.selectedProject.path, '')
      },
      /**
       * Reset result
       */
      resetResult () {
        this.isLoading = false
        this.result = []
      },
      /**
       * On IPC result
       * @param result
       * @returns {boolean}
       */
      onIpcResult (result) {
        console.log('Result IPC', result)
        this.resetResult()
        if (result.code) {
          switch (result.code) {
            case 0:
              this.setNoError()
              break

            case 1:
            case 2:
              let json = this.convertJSON(result.stdout)
              if (!json) {
                remote.dialog.showErrorBox('Erreur', 'Erreur lors de l\'analyse !')
                return false
              }
              this.result = json['duplication'].sort((a, b) => {
                return b.attr.lines - a.attr.lines
              })
              break

            case 3:
              remote.dialog.showErrorBox('Erreur', 'Erreur lors de l\'analyse !')
              return false

            default:
              console.log('result code unknown', result.code)
              return false
          }
          this.saveProject()
        } else {
          let json = this.convertJSON(result)
          if (json && !json.hasOwnProperty('duplication')) {
            this.setNoError()
          }
        }
      },
      /**
       * Set no error
       */
      setNoError () {
        this.noError = true
        this.result = []
        this.saveProject()
      },
      /**
       * Convert XML to JSON
       * @param {String} xml
       * @return {Object|Boolean} Json or false
       */
      convertJSON (xml) {
        let json = xml2json(xml, {
          compact: true,
          ignoreDeclaration: true,
          instructionHasAttributes: true,
          nativeTypeAttributes: true,
          alwaysArray: true,
          attributesKey: 'attr',
          textKey: 'txt',
          trim: true,
        })
        json = JSON.parse(json)
        delete json.attr

        if (json.hasOwnProperty('pmd-cpd') && json['pmd-cpd'][0]) {
          return json['pmd-cpd'][0]
        }

        return false
      },
      /**
       * Save the project
       */
      saveProject () {
        Project.updateCopy(this.selectedProject._id, 0).then((project) => {
          Cache.set(this.cacheId, this.result, 0, [`project_${this.selectedProject._id}`])
          this.$store.commit(types.MUTATIONS.SELECT_PROJECT, project)
        })
      },
    },
    watch: {
      selectedProject (project) {
        if (project._id) {
          if (Cache.isValid(this.cacheId)) {
            this.resetResult()
            this.result = Cache.get(this.cacheId, [])
          } else {
            this.isLoading = true
            ipcRenderer.send('phpcopy-cmd', this.selectedProject.toJSON())
          }
        }
      },
    },
    mounted () {
      console.log('[VUE] Mount CopyPaste.vue')
      this.$store.commit(types.MUTATIONS.SELECT_PROJECT)
      this.$store.dispatch(types.ACTIONS.LOAD_LAST_PROJECT)

      ipcRenderer.on('phpcopy-result', (event, result) => {
        this.onIpcResult(result)
      })

      // Shortcut
      remote.getCurrentWindow().on('blur', () => {
        remote.globalShortcut.unregister('F5')
      })
      remote.getCurrentWindow().on('focus', () => {
        remote.globalShortcut.register('F5', this.runAnalyse)
      })
    },
    destroyed () {
      ipcRenderer.removeAllListeners('phpcopy-result')
      remote.globalShortcut.unregister('F5')
      remote.getCurrentWindow().removeAllListeners('blur')
      remote.getCurrentWindow().removeAllListeners('focus')
    },
  }
</script>
