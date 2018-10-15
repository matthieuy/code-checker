import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { localStore } from '../../renderer/store'

export default {
  windows: {},
  parent: null,

  init (parentWindow) {
    this.parent = parentWindow

    ipcMain.on('open-modal', (event, name, url, options) => {
      this.open(name, url, options)
    })
  },

  /**
   * Open a modal
   * @param {String} name
   * @param {String} url
   * @param {Object} options
   * @return {BrowserWindow}
   */
  open (name, url, options) {
    if (this.windows[name]) {
      this.windows[name].show()
      return this.windows[name]
    }
    if (!url) {
      return false
    }

    // Default options
    options = Object.assign({
      title: app.getName(),
      backgroundColor: '#181A1F',
      icon: localStore.getIconPath(),
      useContentSize: true,
      center: true,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      skipTaskbar: true,
      show: false,
      frame: true,
      parent: this.parent,
      modal: true,
      webPreferences: {
        devTools: localStore.get(localStore.KEY.DEVTOOLS.ENABLE),
      },
    }, options)

    // Create window
    const win = this.windows[name] = new BrowserWindow(options)
    win.loadURL(`${global.winURL}/modal.html#${url}`)
    win.setMenu(null)
    win.once('ready-to-show', () => { win.show() })

    // Close event
    if (!globalShortcut.isRegistered('Escape') && (typeof options.escape === 'undefined' || options.escape)) {
      globalShortcut.register('Escape', () => {
        win.close()
      })
    }

    win.once('close', () => {
      console.log('[MODAL] Close ', name)
      this.parent.webContents.send('modal-close', name)
      if (globalShortcut.isRegistered('Escape')) {
        globalShortcut.unregister('Escape')
      }
    })
    win.once('closed', () => { delete this.windows[name] })
    if (process.env.NODE_ENV === 'development' && localStore.get(localStore.KEY.DEVTOOLS.OPEN, false)) {
      win.openDevTools()
    }

    return win
  },
}
