import { app, Menu } from 'electron'
import Updater from './update'
import { localStore } from '../../renderer/store'
import modalSystem from '../windows/modalSystem'

let template = [
  {
    label: 'Fichier',
    submenu: [
      {
        label: 'Quitter',
        accelerator: 'CommandOrControl+W',
        click () {
          app.quit()
        },
      },
    ],
  },
  {
    label: 'Affichage',
    submenu: [
      { label: 'Rafraichir', role: 'reload', accelerator: 'Ctrl+F5' },
      {
        label: 'Toujours au-dessus',
        type: 'checkbox',
        click (menuItem, browserWindow) {
          let onTop = browserWindow.isAlwaysOnTop()
          browserWindow.setAlwaysOnTop(!onTop)
          menuItem.checked = !onTop
        },
      },
      {
        id: 'fullscreen',
        label: 'Plein écran',
        type: 'checkbox',
        accelerator: 'F11',
        click (menuItem, browserWindow) {
          if (browserWindow.isMaximized()) {
            browserWindow.unmaximize()
            menuItem.checked = false
          } else {
            browserWindow.maximize()
            menuItem.checked = true
          }
        },
      },
      {
        id: 'devtools',
        label: 'DevTools',
        accelerator: 'F12',
        type: 'checkbox',
        visible: false,
        click (menuItem, browserWindow) {
          browserWindow.webContents.toggleDevTools()
        },
      },
    ],
  },
  {
    label: '?',
    submenu: [
      {
        label: 'Vérifier les mises à jour',
        click (menuItem, browserWindow) {
          Updater.init(browserWindow)
          Updater.check(false)
        },
      },
      {
        label: 'À propos',
        click (menuItem, browserWindow) {
          modalSystem.open('about', '/about', {
            title: 'À propos',
            width: 300,
            height: 270,
            frame: false,
          })
        },
      },
    ],
  },
]

export default {
  init (win) {
    // Create menu
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    // Fullscreen
    let fullscreenItem = menu.getMenuItemById('fullscreen')
    fullscreenItem.checked = win.isMaximized()
    win.on('resize', (event) => { fullscreenItem.checked = event.sender.isMaximized() })
    win.on('unmaximize', () => { fullscreenItem.checked = false })

    // DevTools
    let devToolsItem = menu.getMenuItemById('devtools')
    let webContents = win.webContents
    devToolsItem.visible = localStore.get(localStore.KEY.DEVTOOLS.ENABLE, false)
    devToolsItem.checked = webContents.isDevToolsOpened()
    webContents.on('devtools-opened', () => {
      devToolsItem.checked = true
      localStore.set(localStore.KEY.DEVTOOLS.OPEN, true)
    })
    webContents.on('devtools-closed', () => {
      devToolsItem.checked = false
      localStore.set(localStore.KEY.DEVTOOLS.OPEN, false)
    })
    if (localStore.get(localStore.KEY.DEVTOOLS.OPEN, false) && localStore.get(localStore.KEY.DEVTOOLS.ENABLE, false)) {
      webContents.openDevTools()
    }
  },
}
