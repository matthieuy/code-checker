<template>
  <div class="pane-group">
    <div class="pane-sm sidebar">
      <ul class="list-group">
        <li class="list-group-header">
          <div class="text-center">
            <div class="btn btn-nav btn-large" :class="{active: showAddForm}" @click="btnAddProject()">
              <i class="fa fa-plus-circle"></i>
              Ajouter un projet
            </div>
          </div>
        </li>
        <li
            v-for="project in projects"
            @contextmenu.prevent="$refs.ProjectCtx.$refs.ctx.open($event, project)"
            @click="selectProject(project)"
            class="list-group-item cursor project-item"
            :class="{active: selectedProject === project}"
        >
          <img class="img-circle media-object pull-left" :src="getFavicon(project)" width="32" height="32">
          <div class="media-body">
            <strong>{{ project.name }}</strong>
            <p style="direction: rtl;">{{ project.path }}</p>
          </div>
        </li>
      </ul>
    </div>

    <div class="pane padding">
      <add-project-form v-show="showAddForm" v-on:hideAddForm="showAddForm=false"></add-project-form>
      <div v-if="!showAddForm && selectedProject._id">
        <h1 class="text-center">{{ selectedProject.name }}</h1>
        <div class="text-center">
          <div>
            Dossier : {{ selectedProject.path }} <i class="fa fa-folder-open vam cursor" @click="openExplorer()"></i>
          </div>
          <div>
            Dernière mise à jour : {{ selectedProject.lastUpdate | formatDate('DD/M à HH:mm') }}<br>
          </div>
        </div>

        <fieldset>
          <legend>Analyse de la syntaxe</legend>
          <div v-show="selectedProject.csDate">
            Dernière analyse {{ selectedProject.csDate | formatDate('DD/M à HH:mm') }}
            <div v-show="selectedProject.csErrors">
              <i class="fa fa-error"></i>
              {{ selectedProject.csErrors | defaut(0) | plurialize('erreur', 'erreurs')}}
            </div>
            <div v-show="selectedProject.csWarnings">
              <i class="fa fa-warning"></i>
              {{ selectedProject.csWarnings | defaut(0) | plurialize('alerte', 'alertes')}}
            </div>
            <div v-show="selectedProject.csFixable">
              <i class="fa fa-fixable"></i>
              {{ selectedProject.csFixable | defaut(0) | plurialize('corrigeable', 'corrigeables')}}
            </div>
            <div v-show="!selectedProject.csErrors && !selectedProject.csWarnings">
              <i class="fa fa-thumbs-up"></i> Code OK
            </div>
          </div>
          <div v-show="!selectedProject.csDate">
            Aucune analyse de syntaxe réalisée
          </div>
          <div class="text-center">
            <router-link :to="{name: 'sniffer', params: { id: selectedProject._id }}" class="btn btn-nav">
              <i class="fa fa-code"></i> Analyser la syntaxe du code PHP
            </router-link>
          </div>
        </fieldset>

        <fieldset>
          <legend>Qualité du code</legend>
          <div v-show="selectedProject.mdDate">
            Dernière analyse {{ selectedProject.mdDate | formatDate('DD/MM à HH:mm') }}
            <div v-show="selectedProject.mdErrors">
              <i class="fa fa-error"></i>
              {{ selectedProject.mdErrors | defaut(0) | plurialize('erreur', 'erreurs')}}
            </div>
            <div v-show="selectedProject.mdWarnings">
              <i class="fa fa-warning"></i>
              {{ selectedProject.mdWarnings | defaut(0) | plurialize('alerte', 'alertes')}}
            </div>
            <div v-show="!selectedProject.mdErrors && !selectedProject.mdWarnings">
              <i class="fa fa-thumbs-up"></i> Code OK
            </div>
          </div>
          <div v-show="!selectedProject.mdDate">
            Aucune analyse de la qualité du code
          </div>
          <div class="text-center">
            <router-link :to="{name: 'md', params: { id: selectedProject._id }}" class="btn btn-nav">
              <i class="fa fa-microscope"></i> Vérifier la qualité du code
            </router-link>
          </div>
        </fieldset>

        <fieldset>
          <legend>Code dupliqué</legend>
          <div v-show="selectedProject.copyDate">
            Dernière analyse {{ selectedProject.copyDate | formatDate('DD/MM à HH:mm') }}
            <div v-show="selectedProject.copyWarnings">
              <i class="fa fa-warning"></i>
              {{ selectedProject.copyWarnings | defaut(0) | plurialize('alerte', 'alertes')}}
            </div>
            <div v-show="!selectedProject.copyWarnings">
              <i class="fa fa-thumbs-up"></i> Code OK
            </div>
          </div>
          <div v-show="!selectedProject.copyDate">
            Aucune analyse de code dupliqué
          </div>
          <div class="text-center">
            <router-link :to="{name: 'copy', params: { id: selectedProject._id }}" class="btn btn-nav">
              <i class="fa fa-paste"></i> Détecter le code dupliqué
            </router-link>
          </div>
        </fieldset>

        <fieldset>
          <legend>Configuration des dossiers PHP</legend>
          <div v-for="(phpPath, index) in phpPaths">
            <div class="form-group">
              <input type="text" v-model="phpPaths[index]" class="form-control form-php-dir" />
              <i class="fa fa-times-circle" @click="phpPaths.splice(index, 1)" v-tooltip="'Enlever ce dossier PHP du projet'"></i>
            </div>
          </div>
          <div class="form-actions text-center">
            <button class="btn btn-nav" @click="phpPaths.push('')">
              <i class="fa fa-plus-circle"></i> Ajouter
            </button>
            <button class="btn btn-nav" @click="savePhpPath()">
              <i class="fa fa-save"></i> Sauvegarder
            </button>
          </div>
        </fieldset>
      </div>
    </div>
    <project-ctx ref="ProjectCtx">&nbsp;</project-ctx>
  </div>
</template>

<script>
  import fs from 'fs'
  import { remote } from 'electron'
  import { mapState, mapGetters } from 'vuex'

  import { Project } from '../db'
  import { types } from '../store'
  import ProjectCtx from './context/Project'
  import AddProjectForm from './form/AddProject'

  export default {
    components: {
      ProjectCtx,
      AddProjectForm,
    },
    data () {
      return {
        showAddForm: false,
        phpPaths: [],
      }
    },
    computed: {
      ...mapState([
        'selectedProject',
      ]),
      ...mapGetters({
        projects: types.GETTERS.PROJECTS,
      }),
    },
    methods: {
      /**
       * Clic on "add project" button
       */
      btnAddProject () {
        this.selectProject(null)
        this.showAddForm = true
      },
      /**
       * Save php path
       */
      savePhpPath () {
        let paths = []
        this.phpPaths.forEach((p) => {
          if (p.length > 0) {
            let completPath = this.selectedProject.path + p
            if (fs.existsSync(completPath)) {
              paths.push(p)
            } else {
              remote.dialog.showErrorBox('CodeChecker', `Le dossier ${completPath} n'existe pas !`)
            }
          }
        })
        if (!paths.length) {
          paths.push('/')
        }
        Project.findOne({ _id: this.selectedProject._id }).then((project) => {
          project.phpPath = paths
          project.save().then(() => {
            this.phpPaths = paths
            this.$store.commit(types.MUTATIONS.SELECT_PROJECT, project)
          })
        })
      },
      /**
       * Select a project
       * @param {Project|null} project
       */
      selectProject (project) {
        this.showAddForm = false
        if (project === this.selectedProject) {
          return false
        }
        this.$store.commit(types.MUTATIONS.SELECT_PROJECT, project)
      },
      /**
       * Open project path in explorer
       */
      openExplorer () {
        this.$store.dispatch(types.ACTIONS.OPEN_DIR, this.selectedProject.path)
      },
      /**
       * Get favicon url
       * @param {Project} project
       * @return {string} URL or base64
       */
      getFavicon (project) {
        if (project.favicon && fs.existsSync(project.path + project.favicon)) {
          let data = fs.readFileSync(project.path + project.favicon)
          let buffer = Buffer.from(data).toString('base64')
          return 'data:image/png;base64,' + buffer
        } else {
          return 'static/empty.png'
        }
      },
    },
    watch: {
      selectedProject (project) {
        this.phpPaths = (project) ? project.phpPath : []
      },
    },
    mounted () {
      console.log('[VUE] Mount Projects.vue')
      this.phpPaths = (this.selectedProject) ? this.selectedProject.phpPath : []
    },
  }
</script>

<style lang="scss">
  @import "../assets/scss/vars";
  .project-item {
    p {
      font-style: italic;
      color: #6d6c6d;
    }
  }
  .project-loading {
    font-style: italic;
  }
  .form-php-dir {
    width: calc(100% - 20px);
  }
  .form-actions {
    margin-top: 10px;
  }
  fieldset {
    border-radius: 8px;
    border-color: $sidebarBorder;
  }
  legend {
    color: $navTitle;
  }
</style>
