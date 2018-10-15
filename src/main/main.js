/**
 * Common file for dev and prod environment
 */
import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'

import Updater from './system/update'
import { localStore } from '../renderer/store'

let mainWindow
let path = require('path')

app.setAppUserModelId('com.matthieuy.code-checker')
console.log('Environment: ', process.env.NODE_ENV)
if (process.env.NODE_ENV !== 'production') {
  global.__static = `${path.join(__dirname, '../../static').replace(/\\/g, '\\\\')}`
  global.winURL = 'http://localhost:9080'
} else {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
  global.winURL = `file://${__dirname}`
}
/*************
 * Listeners *
 *************/
app.on('ready', () => {
  let SplashScreen = require('./windows/splashscreen').default
  SplashScreen.init()
  ipcMain.on('splashscreen-display', () => {
    createWindow()
  })
})

// on activate => create the main window if undefined
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// All windows closed => exit (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

/*******************
 * Single instance *
 *******************/
// Singleton instance
const isNotSingleInstance = app.makeSingleInstance((argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore()
    }
    mainWindow.show()
    mainWindow.focus()
    mainWindow.loadURL(global.winURL)
  }
})

// Quit double instance
if (isNotSingleInstance) {
  console.info('Multi instance : close app')
  app.quit()
}

/**********************
 * Create main window *
 **********************/
function createWindow () {
  mainWindow = new BrowserWindow({
    height: 600,
    minWidth: 850,
    minHeight: 500,
    icon: localStore.getIconPath(),
    useContentSize: true,
    center: true,
    title: app.getName(),
    backgroundColor: '#36393E',
    fullscreenable: false,
    show: false,
    width: 1000,
    webPreferences: {
      nodeIntegration: (process.env.NODE_ENV === 'development'),
      devTools: localStore.get(localStore.KEY.DEVTOOLS.ENABLE, false),
    },
  })

  // Load main window
  mainWindow.loadURL(global.winURL)

  // Main menu
  let mainMenu = require('./system/menu').default
  mainMenu.init(mainWindow)

  // Modal
  let modalSystem = require('./windows/modalSystem').default
  modalSystem.init(mainWindow)

  // App full loaded
  ipcMain.on('app-ready', () => {
    console.info('App is ready')

    // Updater
    Updater.init(mainWindow)
    if (process.env.NODE_ENV !== 'development') {
      Updater.check(true)
    }

    if (mainWindow) {
      mainWindow.show()
    }
  })

  // Close window
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Catch exception
process.on('uncaughtException', function (e) {
  console.error('[EXCEPTION]', e)
})
