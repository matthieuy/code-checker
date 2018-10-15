<template>
  <div class="detect-window">
    <div class="pane-group">
      <div class="pane-sm sidebar shows-sb">
        <nav class="nav-group">
          <h5 class="nav-group-title">Synthèse</h5>
          <span class="nav-group-item">
            <i class="fa fa-error"></i>
            {{ errors | defaut(0) | plurialize('erreur', 'erreurs')}}
          </span>
          <span class="nav-group-item">
            <i class="fa fa-warning"></i>
            {{ warnings | defaut(0) | plurialize('alerte', 'alertes')}}
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
          <span class="nav-group-item" v-show="selectedProject.mdDate">{{ selectedProject.mdDate | formatDate('DD/M à HH:mm') }}</span>
          <span class="nav-group-item" v-show="!selectedProject.mdDate">Aucune</span>
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
              <h1 class="text-center">Qualité du code</h1>
            </li>
            <li class="list-group-item text-center no-error" v-show="noError">
              <i class="fa fa-thumbs-up"></i> Félicitation ! Votre projet passe les tests de qualité !
            </li>
            <li
              class="list-group-item"
              v-for="(file, index) in phpmd.error"
              :class="{ open: currentFile === file.attr.filename }"
              @contextmenu.prevent="$refs.FileCtx.$refs.ctx.open($event, file.attr.filename)">
              <div class="cursor" @click="changeCurrentFile(file.attr.filename)">
                <div class="pull-left">
                  <div class="filename">{{ getFilename(file.attr.filename) }}</div>
                  <div class="stats-file">
                    <span><i class="fa fa-error"></i> 1 erreur</span> : Impossible de scanner le fichier car il contient des erreurs PHP
                  </div>
                </div>
                <div class="pull-right"></div>
              </div>
              <div v-if="currentFile === file.attr.filename">
                <div class="message-report">
                  <div class="header-message" @click="changeCurrentError(index, file.attr.filename, file.line, null)">
                    <div class="pull-left">
                      <i class="fa fa-error"></i>
                      {{ getMessageFromErrorMsg(file.attr.msg) }}
                    </div>
                    <div class="pull-right" v-show="file.line">
                      <span class="line">Ligne {{ file.line }}</span>
                    </div>
                  </div>
                  <div class="message-content" v-if="currentError === index && file.line">
                    <pre v-highlightjs="extractCode"><code class="php" :data-line="file.line" data-before="1"></code></pre>
                  </div>
                </div>
              </div>
            </li>
            <li
              class="list-group-item"
              v-for="file in phpmd.file"
              :class="{ open: currentFile === file.attr.name }"
              @contextmenu.prevent="$refs.FileCtx.$refs.ctx.open($event, file.attr.name)">
              <div class="cursor" @click="changeCurrentFile(file.attr.name)">
                <div class="pull-left">
                  <div class="filename">{{ getFilename(file.attr.name) }}</div>
                  <div class="stats-file">
                    <span>
                      <i class="fa fa-warning"></i>
                      {{ file.violation.length | plurialize('alerte', 'alertes') }}
                    </span>
                  </div>
                </div>
                <div class="pull-right"></div>
              </div>
              <div v-if="currentFile === file.attr.name">
                <div class="message-report" v-for="(violation, index) in file.violation">
                  <div class="header-message" @click="changeCurrentError(index, file.attr.name, violation.attr.beginline, violation.attr.endline)">
                    <div class="pull-left">
                      <i class="fa fa-thermometer-empty" v-show="violation.attr.priority === 1" v-tooltip="'Priorité basse'"></i>
                      <i class="fa fa-thermometer-half" v-show="violation.attr.priority === 2" v-tooltip="'Priorité moyenne'"></i>
                      <i class="fa fa-thermometer-full" v-show="violation.attr.priority >= 3" v-tooltip="'Priorité haute'"></i>
                      {{ violation.txt[0] }}
                    </div>
                    <div class="pull-right">
                      <span class="line" v-show="violation.attr.beginline === violation.attr.endline">Ligne {{ violation.attr.beginline }}</span>
                      <span class="line" v-show="violation.attr.beginline !== violation.attr.endline">Lignes {{ violation.attr.beginline}} à {{ violation.attr.endline }}</span>
                    </div>
                  </div>
                  <div class="message-content" v-if="currentError === index">
                    <pre v-highlightjs="extractCode"><code class="php" :data-line="violation.attr.beginline" data-before="1"></code></pre>
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
        phpmd: {},
        extractCode: '',
        currentFile: null,
        currentError: null,
        warnings: 0,
        errors: 0,
        noError: false,
      }
    },
    computed: {
      ...mapState([
        'selectedProject',
      ]),
      cacheId () {
        return 'phpmd_' + this.selectedProject._id
      },
    },
    methods: {
      /**
       * Run PHPMD
       */
      runAnalyse () {
        if (this.isLoading) {
          return false
        }
        this.isLoading = true
        this.currentFile = null
        this.currentError = null
        ipcRenderer.send('phpmd-cmd', this.selectedProject.toJSON())
      },
      /**
       * On receive PHPMD Result
       * @param {Object} result
       */
      onIpcResult (result) {
        console.log('MD Result', result)
        this.resetResult()
        if (result.code) {
          switch (result.code) {
            case 0:
              this.noError = true
              break

            case 1:
            case 2:
              let json = xml2json(result.stdout, {
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
              this.phpmd = json.pmd[0]
              break

            case 3:
              remote.dialog.showErrorBox('Erreur', 'Erreur lors de l\'analyse !')
              return false

            default:
              console.log('result code unknown', result.code)
              return false
          }

          Project.updateMD(this.selectedProject._id, this.warnings, this.errors).then((project) => {
            Cache.set(this.cacheId, this.phpmd, 0, [`project_${this.selectedProject._id}`])
            this.$store.commit(types.MUTATIONS.SELECT_PROJECT, project)
          })
        }
      },
      /**
       * Reset result
       */
      resetResult () {
        this.isLoading = false
        this.warnings = 0
        this.errors = 0
        this.phpmd = {}
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
       * @param {Integer|null} end
       */
      changeCurrentError (error, filename, start, end) {
        this.currentError = (error === this.currentError) ? null : error
        if (end === null) {
          end = start
        }
        this.extractCode = ''
        if (this.currentError !== null) {
          this.$store.dispatch(types.ACTIONS.GET_LINES, {
            file: filename,
            start: start - 1,
            end: end - 1,
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
       * Get line from the error message
       * @param {String} message
       * @returns {Integer|Boolean} The number or false
       */
      getLineFromErrorMsg (message) {
        let match = message.match(/(.*), line: ([0-9]+),(.*)/)
        return (match && match.length === 4) ? parseInt(match[2]) : false
      },
      /**
       * Get the error message (without line, col, file,...)
       * @param {String} message
       * @returns {string}
       */
      getMessageFromErrorMsg (message) {
        let match = message.match(/(.*), line: (.*)/)
        return (match && match.length === 3) ? match[1] : ''
      },
    },
    watch: {
      selectedProject (project) {
        if (project._id) {
          if (Cache.isValid(this.cacheId)) {
            this.resetResult()
            this.phpmd = Cache.get(this.cacheId, {})
          } else {
            this.isLoading = true
            ipcRenderer.send('phpmd-cmd', this.selectedProject.toJSON())
          }
        }
      },
      phpmd (json) {
        console.log('Change', json)
        this.warnings = 0
        this.errors = 0
        if (json.file) {
          json.file.forEach((file) => {
            this.warnings += (file.hasOwnProperty('violation')) ? file.violation.length : 0
          })
        }
        if (json.error) {
          json.error.forEach((error, i) => {
            this.phpmd.error[i].line = this.getLineFromErrorMsg(error.attr.msg)
          })
          this.errors = json.error.length
        }
      },
    },
    mounted () {
      console.log('[VUE] Mount MessDetector.vue')
      this.$store.commit(types.MUTATIONS.SELECT_PROJECT)
      this.$store.dispatch(types.ACTIONS.LOAD_LAST_PROJECT)

      ipcRenderer.on('phpmd-result', (event, result) => {
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
      ipcRenderer.removeAllListeners('phpmd-result')
      remote.globalShortcut.unregister('F5')
      remote.getCurrentWindow().removeAllListeners('blur')
      remote.getCurrentWindow().removeAllListeners('focus')
    },
  }
</script>

<style lang="scss">
  .fa-thermometer-empty, .fa-thermometer-quarter, .fa-thermometer-half, .fa-thermometer-full {
    font-size: 15px;
    color: #f72525;
  }
</style>
