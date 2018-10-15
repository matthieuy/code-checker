import fs from 'fs'
import { shell } from 'electron'
import { types, localStore } from './index'
import { Project } from '../db'

export default {
  /**
   * Open a directory in explorer
   * @param context
   * @param {String} dirpath
   */
  [types.ACTIONS.OPEN_DIR] (context, dirpath) {
    shell.openItem(dirpath)
  },
  /**
   * Select file in folder explorer
   * @param context
   * @param {String} filePath
   */
  [types.ACTIONS.EXPLORER_FILE] (context, filePath) {
    shell.showItemInFolder(filePath)
  },
  /**
   * Load projects list
   * @return {Promise}
   */
  [types.ACTIONS.PROJECTS_LOAD] (context) {
    return Project.getList().then((projects) => {
      context.commit(types.MUTATIONS.PROJECTS_SET, projects)
      context.dispatch(types.ACTIONS.LOAD_LAST_PROJECT)
      return Promise.resolve(projects)
    })
  },
  /**
   * Add a project
   * @param context
   * @param {Object} projectData
   * @return {Promise}
   */
  [types.ACTIONS.ADD_PROJECT] (context, projectData) {
    let project = Project.create(projectData)

    return project.save().then((project) => {
      context.commit(types.MUTATIONS.ADD_PROJECT, project)
      return Promise.resolve(project)
    })
  },
  /**
   * Delete a project
   * @param context
   * @param {Project} project
   * @return {Promise}
   */
  [types.ACTIONS.DEL_PROJECT] (context, project) {
    return Project.deleteOne({ _id: project._id }).then(() => {
      Cache.invalidateByTags(`project_${project._id}`)
      if (localStore.get(localStore.KEY.LAST_PROJECT, false) === project._id) {
        localStore.delete(localStore.KEY.LAST_PROJECT)
      }
      context.dispatch(types.ACTIONS.PROJECTS_LOAD)
      context.commit(types.MUTATIONS.SELECT_PROJECT, null)
    })
  },
  /**
   * Load last project open
   * @param context
   */
  [types.ACTIONS.LOAD_LAST_PROJECT] (context) {
    let idLastProject = localStore.get(localStore.KEY.LAST_PROJECT, false)
    if (idLastProject) {
      let project = context.state.projects.find((project) => {
        return project._id === idLastProject
      })
      if (project) {
        context.commit(types.MUTATIONS.SELECT_PROJECT, project)
      }
    }
  },
  /**
   * Get content line of a file
   * @param context
   * @param {Object} data {file, start, end}
   * @return {Promise}
   */
  [types.ACTIONS.GET_LINES] (context, data) {
    return new Promise((resolve, reject) => {
      let contentFile = fs.readFileSync(data.file, 'utf8')
      let lines = contentFile.split('\n')
      let result = []
      for (let line in lines) {
        if (line >= data.start && line <= data.end) {
          result.push(lines[line].replace(/(?:\r\n|\r|\n)/g, ''))
        }
        if (line >= lines.length || line >= data.end) {
          break
        }
      }
      result = result.join('\r\n')

      return resolve(result)
    })
  },
}
