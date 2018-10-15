<template>
  <context-menu ref="ctx" @ctx-open="onOpen" @ctx-close="onCtxClose" @ctx-cancel="onCtxClose">
    <li class="ctx-header">{{ project.name }}</li>
    <li class="ctx-item" :class="{disabled: !exist}" @click="openExplorer()">
      <i class="fa fa-folder-open"></i>
      Ouvrir dans l'explorer
    </li>
    <li class="ctx-item" @click="deleteProject()">
      <i class="fa fa-times-circle"></i>
      Supprimer
    </li>
  </context-menu>
</template>

<script>
  import fs from 'fs'
  import { types } from '../../store'

  export default {
    data () {
      return {
        project: {
          name: null,
          path: null,
        },
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
        this.$store.dispatch(types.ACTIONS.OPEN_DIR, this.project.path)
      },
      /**
       * Delete a project
       */
      deleteProject () {
        this.$store.dispatch(types.ACTIONS.DEL_PROJECT, this.project)
      },
      /**
       * On open context menu
       * @param {Object} project
       */
      onOpen (project) {
        console.log('[CONTEXT]', project)
        this.project = project
        fs.stat(project.path, (err) => {
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
