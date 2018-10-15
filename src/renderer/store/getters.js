import types from './types'

export default {
  /**
   * Get projects list
   * @return {Project[]}
   */
  [types.GETTERS.PROJECTS]: (state) => {
    return Array.from(state.projects).sort((a, b) => {
      return b.lastUpdate - a.lastUpdate
    })
  },
}
