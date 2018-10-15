<template>
    <div class="detect-window">
        <div class="pane-group">
            <div class="pane-sm sidebar shows-sb">
                <nav class="nav-group">
                    <h5 class="nav-group-title">Synthèse</h5>
                    <span class="nav-group-item">
                        <i class="fa fa-error"></i>
                        {{ phpcs.totals.errors | defaut(0) | plurialize('erreur', 'erreurs')}}
                    </span>
                    <span class="nav-group-item">
                        <i class="fa fa-warning"></i>
                        {{ phpcs.totals.warnings | defaut(0) | plurialize('alerte', 'alertes')}}
                    </span>
                    <span class="nav-group-item">
                        <i class="fa fa-fixable"></i>
                        {{ phpcs.totals.fixable | defaut(0) | plurialize('corrigeable', 'corrigeables')}}
                    </span>
                </nav>
                <nav class="nav-group">
                    <h5 class="nav-group-title">Actions</h5>
                    <div class="nav-group-item">
                        <div class="btn btn-nav btn-action cursor" @click="runAnalyse()" v-tooltip="'Relancer une analyse'">
                            <i class="fa fa-sync spinner-loading" :class="{'fa-spin': isLoading}"></i> Rafraichir
                        </div>
                    </div>
                    <div class="nav-group-item" v-show="!isLoading && phpcs.totals.fixable">
                        <div class="btn btn-nav btn-action cursor" @click="repare()" v-tooltip="'Corriger les erreurs automatiquement'">
                            <i class="fa" :class="[isLoadingRepare ? 'fa-spinner fa-spin' : 'fa-fixable' ]"></i> Tout corriger
                        </div>
                    </div>
                </nav>
                <nav class="nav-group">
                    <h5 class="nav-group-title">Dernière analyse :</h5>
                    <span class="nav-group-item" v-show="selectedProject.csDate">{{ selectedProject.csDate | formatDate('DD/MM à HH:mm') }}</span>
                    <span class="nav-group-item" v-show="!selectedProject.csDate">Aucune</span>
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
                            <h1 class="text-center">Syntaxe PHP</h1>
                        </li>
                        <li class="list-group-item text-center no-error" v-show="noError">
                            <i class="fa fa-thumbs-up"></i> Félicitation ! Aucune erreur de syntaxe trouvé dans votre projet !
                        </li>
                        <li
                            class="list-group-item"
                            v-for="(data, filename) in phpcs.files"
                            :class="{open: currentFile === filename}"
                            v-show="data.messages.length"
                            @contextmenu.prevent="$refs.SnifferCtx.$refs.ctx.open($event, filename, fixable[filename])"
                        >
                            <div @click="changeCurrentFile(filename)" class="cursor">
                                <div class="pull-left">
                                    <div class="filename">{{ getFilename(filename) }}</div>
                                    <div class="stats-file">
                                    <span v-show="data.errors">
                                        <i class="fa fa-error"></i>
                                        {{ data.errors | plurialize('erreur', 'erreurs') }}
                                    </span>
                                    <span v-show="data.warnings">
                                        <i class="fa fa-warning"></i>
                                        {{ data.warnings | plurialize('alerte', 'alertes') }}
                                    </span>
                                    <span v-show="fixable[filename]">
                                        <i class="fa fa-fixable"></i>
                                        {{ fixable[filename] | plurialize('corrigeable', 'corrigeables') }}
                                    </span>
                                    </div>
                                </div>
                                <div class="pull-right" v-show="fixable[filename]">
                                    <button class="btn btn-nav btn-action" @click.stop="repare(filename)" v-tooltip="'Corriger automatiquement ce fichier'">
                                        <i class="fa" :class="[isLoadingRepare ? 'fa-spinner fa-spin' : 'fa-fixable' ]"></i>
                                        Corriger
                                    </button>
                                </div>
                            </div>
                            <div v-if="currentFile === filename">
                                <div class="message-report" v-for="(message, index) in data.messages">
                                    <div class="header-message" @click="changeCurrentError(index, filename, message.line)">
                                        <div class="pull-left">
                                            <i class="fa fa-error" v-show="message.type === 'ERROR'"></i>
                                            <i class="fa fa-warning" v-show="message.type === 'WARNING'"></i>
                                            {{ translateMessage(message.source, message.message) }}
                                        </div>
                                        <div class="pull-right">
                                            <span class="line">Ligne {{ message.line }}, colonne {{ message.column }}</span>
                                            <i v-show="message.fixable" class="fa fa-fixable" v-tooltip="'Erreur corrigeable automatiquement'"></i>
                                            <i v-show="!message.fixable" class="fa fa-fixable" style="color: tomato;" v-tooltip="'Vous devez corriger manuellement cette erreur'"></i>
                                        </div>
                                    </div>
                                    <div class="message-content" v-if="currentError === index">
                                        <pre v-highlightjs="extractCode"><code class="php" :data-line="message.line" data-before="4"></code></pre>
                                        <!--Source : {{ message.source }}-->
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <sniffer-ctx
            ref="SnifferCtx"
            v-on:runanalyse="runAnalyse()"
            v-on:fixfile="repare($event)"
        >&nbsp;</sniffer-ctx>
    </div>
</template>

<script>
    import { mapState } from 'vuex'
    import { ipcRenderer, remote } from 'electron'

    import { Cache, Project } from '../db'
    import Translator from '../tools/phpcsTranslator'
    import { types } from '../store'
    import SnifferCtx from './context/Sniffer'

    export default {
      components: {
        SnifferCtx,
      },
      data () {
        return {
          isLoading: false,
          isLoadingRepare: false,
          noError: false,
          phpcs: {
            totals: {},
            files: {},
          },
          fixable: {},
          extractCode: '',
          currentFile: null,
          currentError: null,
        }
      },
      computed: {
        ...mapState([
          'selectedProject',
        ]),
        cacheId () {
          return 'phpcs_' + this.selectedProject._id
        },
      },
      methods: {
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
         * @param {Integer} line
         */
        changeCurrentError (error, filename, line) {
          this.currentError = (error === this.currentError) ? null : error
          this.extractCode = ''
          if (this.currentError !== null) {
            this.$store.dispatch(types.ACTIONS.GET_LINES, {
              file: filename,
              start: line - 4,
              end: line + 2,
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
         * Run a PHPCS analyse
         */
        runAnalyse () {
          if (this.isLoading) {
            return false
          }
          this.isLoading = true
          this.currentFile = null
          this.currentError = null
          ipcRenderer.send('phpcs-cmd', this.selectedProject.toJSON())
        },
        /**
         * Repare file or project
         * @param {String|null} path The file or null for project
         */
        repare (path) {
          // Loading
          if (this.isLoadingRepare) {
            return false
          }
          this.isLoadingRepare = true

          // Dir/files to scan
          let obj = this.selectedProject.toJSON()
          if (path) {
            obj['scanFile'] = path
          }
          ipcRenderer.send('phpcbf-cmd', obj)
        },
        /**
         * Translate message
         * @param {String} source
         * @param {String} message
         * @return {String}
         */
        translateMessage (source, message) {
          if (remote.app.getLocale().indexOf('fr') === 0) {
            return Translator(source, message)
          } else {
            return message
          }
        },
        /**
         * Reset result and loading
         */
        resetResult () {
          this.isLoading = false
          this.isLoadingRepare = false
          this.noError = false
          this.phpcs = {
            totals: {},
            files: {},
          }
        },
        /**
         * On receive phpcs result
         * @param {Object} result
         */
        onIpcResult (result) {
          console.log('Phpcs result', result)
          if (result.code) {
            this.resetResult()
            switch (result.code) {
              case 0:
                this.noError = true
                break

              // Error in code
              case 1:
              case 2:
                this.phpcs = JSON.parse(result.stdout)
                break

              // Error cmd
              case 3:
                remote.dialog.showErrorBox('Erreur', 'Erreur lors de l\'analyse !')
                return false

              // Other result code
              default:
                console.log('result code unknown', result.code)
                return false
            }

            // Update CS stats
            Project.updateCS(this.selectedProject._id, this.phpcs.totals).then((project) => {
              Cache.set(this.cacheId, this.phpcs, 0, [`project_${this.selectedProject._id}`])
              this.$store.commit(types.MUTATIONS.SELECT_PROJECT, project)
            })
          }
        },
      },
      watch: {
        /**
         * Calculate how many error are fixable
         * @param {Object} json
         */
        phpcs (json) {
          this.fixable = {}
          for (let file in json.files) {
            if (json.files.hasOwnProperty(file)) {
              this.fixable[file] = json.files[file].messages.filter((message) => {
                return message.fixable
              }).length
            }
          }
        },
        selectedProject (project) {
          if (Cache.isValid(this.cacheId)) {
            this.resetResult()
            this.phpcs = Cache.get(this.cacheId, {})
          } else if (project._id) {
            ipcRenderer.send('phpcs-cmd', this.selectedProject.toJSON())
          }
        },
      },
      mounted () {
        console.log('[Vue] Mount CodeSniffer.vue')
        this.$store.commit(types.MUTATIONS.SELECT_PROJECT)
        this.$store.dispatch(types.ACTIONS.LOAD_LAST_PROJECT)

        ipcRenderer.on('phpcs-result', (event, result) => {
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
        ipcRenderer.removeAllListeners('phpcs-result')
        remote.globalShortcut.unregister('F5')
        remote.getCurrentWindow().removeAllListeners('blur')
        remote.getCurrentWindow().removeAllListeners('focus')
      },
    }
</script>

<style lang="scss">
    @import "../assets/scss/vars";
    @import "../assets/darcula_highlight.css";
    .list-files {
        .filename {
            font-weight: bold;
            color: #ffffff;
        }
        .stats-file {
            font-style: italic;
            .fa {
                line-height: 11px;
                margin: 0 2px 0 7px;
            }
        }
        .no-error {
            font-weight: bold;
            color: $positive-color;
            font-size: 1.1em;
        }
    }
    .message-report {
        background-color: $navActiveBg;
        border: 1px solid $sidebarBorder;
        margin-bottom: 5px;
        border-radius: 10px;
        &:first-child {
            margin-top: 10px;
        }
        .header-message {
            padding: 5px 5px 5px 15px;
            cursor: pointer;
            .pull-left .fa {
                margin-right: 8px;
            }
        }
        .message-content {
            padding: 5px 15px;
            background-color: lighten($navActiveBg, 10%);
            border-top: 1px solid $sidebarBorder;
            pre {
                ::-webkit-scrollbar {
                    height: 12px;
                }
                ::-webkit-scrollbar-thumb {
                    background-color: darken(#2b2b2b, 8%);
                    border-color: $sidebarBorder;
                    border-radius: 6px;
                }
                ::-webkit-scrollbar-track-piece {
                    background-clip: padding-box;
                    border-radius: 0 0 6px 6px;
                    background-color: lighten(#2b2b2b, 5%);
                    border-color: $sidebarBorder;
                }
            }
            code {
                white-space: pre;
                text-overflow: initial;
                border-radius: 10px;
            }
        }
        .line {
            font-style: italic;
            color: $navTitle;
            margin-right: 3px;
            .fa {
                vertical-align: middle;
            }
        }
    }
    table.hljs-ln {
        border: 0;
        .hljs-ln-numbers {
            color: $navTitle;
            font-style: italic;
            padding-right: 3px;
            border-right: 1px solid lighten(#2b2b2b, 5%);
        }
        .hljs-ln-code {
            padding-left: 5px;
        }
        .hljs-ln-line{
            white-space: pre;
            & span {
                white-space: pre;
            }
        }
    }
</style>
