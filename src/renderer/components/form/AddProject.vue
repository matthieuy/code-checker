<template>
    <div class="content">
        <h1 class="text-center">Ajouter un projet</h1>
        <div>
            <div class="form-group">
                <label for="path">Dossier du projet :</label>
                <input id="path" v-model="project.path" type="text" class="form-control cursor" readonly @click="selectDir()" />
            </div>
            <div class="form-group">
                <label for="name">Nom du projet :</label>
                <input id="name" type="text" v-model="project.name" class="form-control" />
            </div>

            <div class="form-actions">
                <button class="btn btn-default btn-large" @click="add()">
                    <i class="fa fa-plus-circle"></i> Ajouter
                </button>
            </div>
        </div>
    </div>
</template>

<script>
    import { remote } from 'electron'
    import fs from 'fs'
    import path from 'path'

    import { types } from '../../store'

    export default {
      data () {
        return {
          project: {},
        }
      },
      methods: {
        /**
         * Select project dir
         */
        selectDir () {
          remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            title: 'Dossier du projet PHP',
            defaultPath: this.project.path,
            properties: ['openDirectory', 'createDirectory'],
          }, (dirpath) => {
            if (typeof dirpath !== 'undefined' && fs.existsSync(dirpath[0])) {
              this.project.path = dirpath[0]
              if (!this.project.name.length) {
                this.project.name = path.basename(dirpath[0])
              }
            }
          })
        },
        /**
         * Add project after valid form
         */
        add () {
          if (this.checkForm()) {
            this.$store.dispatch(types.ACTIONS.ADD_PROJECT, this.project).then((project) => {
              console.log('Add project', project)
              this.resetForm()
              this.$emit('hideAddForm') // Hide the form (in parent scope)
              this.$store.commit(types.MUTATIONS.SELECT_PROJECT, project)
            })
          }
        },
        /**
         * Check form
         * @return {boolean}
         */
        checkForm () {
          if (!this.project.path.length || !fs.existsSync(this.project.path)) {
            return false
          }

          if (!this.project.name.length) {
            document.getElementById('name').focus()
            return false
          }

          return true
        },
        /**
         * Reset the form
         */
        resetForm () {
          this.project = {
            path: '',
            name: '',
          }
        },
      },
      mounted () {
        console.log('[VUE] Mount form/AddProject.vue')
        this.resetForm()
      },
    }
</script>
