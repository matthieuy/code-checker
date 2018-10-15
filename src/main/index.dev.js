/**
 * This file is used specifically and only for development.
 */

import { app } from 'electron'

// Use the same path as prod
app.setPath('userData', require('path').join(app.getPath('appData'), 'CodeChecker'))

app.on('ready', () => {
  // Install `vue-devtools`
  let installExtension = require('electron-devtools-installer')
  installExtension.default(installExtension.VUEJS_DEVTOOLS)
    .then(() => {
      // Install devtron
      console.log('Install devtron')
      require('devtron').install()
    })
    .catch(err => {
      console.error('Unable to install `vue-devtools`: \n', err)
    })
})

// Require `main` process to boot app
require('./main')
