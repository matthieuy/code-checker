import { app, dialog, ipcMain, Notification } from 'electron'
import { autoUpdater } from 'electron-updater'
import localStore from '../../renderer/store/local'
import modalSystem from '../windows/modalSystem'

class Updater {
  /**
   * Constructor : init variables
   */
  constructor () {
    autoUpdater.autoDownload = false
    autoUpdater.fullChangelog = true
    if (process.env.NODE_ENV === 'development') {
      autoUpdater.updateConfigPath = require('path').join(__dirname, '../../../.electron-vue/dev-app-update.yml')
      autoUpdater.currentVersion = '0.0.1'
    }

    this._init = false
    this._silent = true
    this._mainWindow = null
    this._webcontent = null
    this._percent = 0
    this._loading = false
  }

  /**
   * Init updater
   * @param {BrowserWindow} mainWindow
   * @returns {Updater}
   */
  init (mainWindow) {
    this._mainWindow = mainWindow
    if (this._init) {
      return this
    }

    // Events
    autoUpdater.on('update-available', this.available)
    autoUpdater.on('update-not-available', this.noUpdate)
    autoUpdater.on('download-progress', this.progress)
    autoUpdater.on('update-downloaded', this.downloaded)
    autoUpdater.on('error', this.error)

    // IPC
    ipcMain.on('start-update', (event) => {
      this._webcontent = event.sender
      autoUpdater.downloadUpdate()
    })

    // First run after update
    if (localStore.get(localStore.KEY.UPDATE.FIRST_RUN, false)) {
      let notif = new Notification({
        title: app.getName(),
        body: 'Vous utilisez maintenant la version v' + app.getVersion(),
        icon: localStore.getIconPath(true),
      })
      notif.show()
      localStore.set(localStore.KEY.UPDATE.FIRST_RUN, false)
    }

    this._init = true
    return this
  }

  /**
   * Check update
   * @param {Boolean} silent Silent check or display modal
   */
  check = (silent) => {
    console.log('[UPDATE] Check...')
    this._silent = silent
    this.changeWindowCursor(true)
    autoUpdater.checkForUpdates()
  }

  /**
   * A update is available (call by autoUpdater)
   * @param {Object} infos
   */
  available = (infos) => {
    console.log('[UPDATE] Available : ', infos.version)
    this.changeWindowCursor(false)

    // Notification
    let notif = new Notification({
      title: app.getName(),
      body: 'Mise à jour disponible : v' + infos.version,
      icon: localStore.getIconPath(true),
    })
    notif.show()

    // Modal
    let modal = modalSystem.open('update', '/update', {
      title: 'Mise à jour',
      width: 400,
      height: 500,
      frame: false,
      skipTaskbar: false,
    })
    modal.on('show', (e) => {
      modal.webContents.send('list-releases', infos.releaseNotes)
    })
  }

  /**
   * No update available (call by autoUpdater)
   * @param {Object} infos
   */
  noUpdate = (infos) => {
    console.log('[UPDATE] App is up-to-date')
    this.changeWindowCursor(false)
    if (!this._silent) {
      dialog.showMessageBox(this._mainWindow, {
        type: 'info',
        buttons: ['OK'],
        title: 'Mise à jour',
        message: 'CodeChecker est à jour : ' + infos.releaseName,
      })
    }
  }

  /**
   * During downloaded (call by autoUpdater)
   * @param {Object} infos
   */
  progress = (infos) => {
    let percent = Math.round(infos.percent)
    this._mainWindow.setProgressBar(percent / 100)
    this.changeWindowCursor(true)
    if (this._percent !== percent) {
      this._mainWindow.setTitle(`CodeChecker - Téléchargement : ${percent}%`)
      this._percent = percent
      if (this._webcontent) {
        this._webcontent.send('progress-update', percent, infos.bytesPerSecond)
      }
    }
  }

  /**
   * A release was downloaded (call by autoUpdater)
   * @param event
   * @param releaseNotes
   * @param releaseName
   */
  downloaded = (event, releaseNotes, releaseName) => {
    console.log('[UPDATE] Release was downloaded')
    this._mainWindow.setTitle('CodeChecker')
    this.changeWindowCursor(true)
    if (this._webcontent) {
      this._webcontent.send('start-install', true)
    }
    localStore.set(localStore.KEY.UPDATE.FIRST_RUN, true)

    autoUpdater.quitAndInstall()
  }

  /**
   * Catch error when update (call by autoUpdater)
   * @param {String} error
   */
  error = (error) => {
    console.error('[UPDATE] Error', error)
    this.changeWindowCursor(false)
    if (!this._silent) {
      dialog.showErrorBox('Mise à jour', 'Impossible de vérifier les mises à jour !')
    }
  }

  /**
   * Change cursor in mainWindow if loading
   * @param {Boolean} loading
   */
  changeWindowCursor = (loading) => {
    if (!this._silent && loading !== this._loading) {
      this._mainWindow.webContents.send('change-load', loading)
      this._loading = loading
    }
  }
}

export default new Updater()
