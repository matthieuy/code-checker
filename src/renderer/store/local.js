/**
 * Local Storage
 */
import ElectronStore from 'electron-store'
import isRenderer from 'is-electron-renderer'

const key = {
  DEVTOOLS: {
    OPEN: 'devtools.open', // {Boolean} Is devtool is open
    ENABLE: 'devtools.enable', // {Boolean} Can open devtools
  },
  LAST_PROJECT: 'last_project', // {String} ID of the last load project
  UPDATE: {
    FIRST_RUN: 'update.first', // {Boolean} First run after update
  },
}

let store = new ElectronStore({
  defaults: {
    devtools: {
      open: false,
    },
  },
})
store.KEY = key

/**
 * Get icon path
 * @param {Boolean} png
 * @return {string} The path
 */
store.getIconPath = (png) => {
  let staticPath = (isRenderer) ? 'static' : __static
  if (png || process.platform !== 'win32') {
    return `${staticPath}/icons/icon.png`
  } else {
    return `${staticPath}/icons/icon.ico`
  }
}

export default store
