import { app, BrowserWindow, ipcMain } from 'electron'

import { localStore } from '../../renderer/store'
import phpcs from '../system/phpcs'

export default {
  win: null,
  url: '',

  /**
   * Init the splashscreen
   * @return {default}
   */
  init () {
    this.url = global.winURL + '/modal.html#/splashscreen'
    this.open()

    ipcMain.on('app-ready', () => {
      if (this.win) {
        this.win.destroy()
        this.win = null
      }
    })

    return this
  },

  /**
   * Create the window and load content
   * @return {default}
   */
  open () {
    this.win = new BrowserWindow({
      height: 245,
      width: 230,
      center: true,
      frame: false,
      title: app.getName(),
      backgroundColor: '#36393E',
      icon: localStore.getIconPath(),
      movable: false,
      skipTaskbar: false,
      alwaysOnTop: true,
      show: false,
      minimizable: false,
      resizable: false,
      maximizable: false,
      webPreferences: {
        devTools: localStore.get(localStore.KEY.DEVTOOLS.ENABLE, false),
      },
    })
    console.log('Load splashscreen :', this.url)
    this.win.loadURL(this.url)
    this.win.on('ready-to-show', () => {
      this.win.show()
      phpcs.init().then(() => {
        ipcMain.emit('splashscreen-display')
      })
    })

    return this
  },
}
