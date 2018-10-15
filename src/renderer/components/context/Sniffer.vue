<template>
    <context-menu ref="ctx" @ctx-open="onOpen" @ctx-close="onCtxClose" @ctx-cancel="onCtxClose">
        <li class="ctx-header" style="text-transform: none;">{{ fileName }}</li>
        <li class="ctx-divider"></li>
        <li class="ctx-item" :class="{disabled: !exist}" @click="openExplorer()">
            <i class="fa fa-folder-open"></i>
            Ouvrir dans l'explorer
        </li>
        <li class="ctx-item" :class="{disabled: !fixable}" @click="fixFile()">
            <i class="fa fa-fixable"></i>
            Réparer
        </li>
        <li class="ctx-item" @click="refreshAnalyse()">
            <i class="fa fa-sync spinner-loading"></i>
            Rafraichir l'analyse
        </li>
    </context-menu>
</template>

<script>
    import fs from 'fs'
    import path from 'path'
    import { types } from '../../store'

    export default {
      data () {
        return {
          pathFile: '',
          fileName: '',
          fixable: false,
          exist: false,
        }
      },
      methods: {
        /**
         * Open project path in explorer
         */
        openExplorer () {
          if (!this.exist) {
            return false
          }
          this.$store.dispatch(types.ACTIONS.EXPLORER_FILE, this.pathFile)
        },
        /**
         * Fixable file
         */
        fixFile () {
          if (this.fixable) {
            this.$emit('fixfile', this.pathFile)
          }
        },
        /**
         * Refresh analyse
         */
        refreshAnalyse () {
          this.$emit('runanalyse')
        },
        /**
         * On open ctx
         */
        onOpen (pathFile, fixable) {
          console.log('[CONTEXT]', pathFile)
          this.pathFile = pathFile
          this.fileName = path.basename(pathFile)
          this.fixable = fixable
          fs.stat(pathFile, (err) => {
            this.exist = (!err)
          })

          // Close other context-menu
          let parentRef = this.$parent.$refs
          let thisTag = this.$options._componentTag
          for (let i in parentRef) {
            if (thisTag !== this.$parent.$refs[i].$options._componentTag && this.$parent.$refs[i].$refs.ctx) {
              this.$parent.$refs[i].$refs.ctx.ctxVisible = false
            }
          }
          window.addEventListener('keydown', this.escapeListener)
        },
        /**
         * On close ctx : remove listener
         */
        onCtxClose () {
          window.removeEventListener('keydown', this.escapeListener)
        },
        /**
         * When press Escape key
         * @param event
         */
        escapeListener (event) {
          if (event.which === 27) {
            this.$refs.ctx.ctxVisible = false
            this.onCtxClose()
          }
        },
      },
    }
</script>
