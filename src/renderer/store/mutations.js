import { remote } from 'electron'
import { types, localStore } from './index'
import { Project } from '../db'

export default {
  /**
   * Set project list
   * @param state
   * @param {Project[]} projects
   */
  [types.MUTATIONS.PROJECTS_SET] (state, projects) {
    state.projects = projects
  },
  /**
   * Add a project to list
   * @param state
   * @param {Project} project
   */
  [types.MUTATIONS.ADD_PROJECT] (state, project) {
    state.projects.push(project)
  },
  /**
   * Select a project
   * @param state
   * @param {Project|false} project
   */
  [types.MUTATIONS.SELECT_PROJECT] (state, project) {
    let title = 'CodeChecker'
    if (project && project.isExist()) {
      title += ` - ${project.name}`
      localStore.set(localStore.KEY.LAST_PROJECT, project._id)
    } else {
      project = new Project()
    }
    remote.getCurrentWindow().setTitle(title)
    state.selectedProject = project
  },
}
