/**
 * This file is used specifically and only for production.
 */
'use strict'

import { app } from 'electron'
let path = require('path')

/********************
 * Portable version *
 ********************/
if (process.env.PORTABLE_EXECUTABLE_DIR) {
  let portablePath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'codechecker_data')
  app.setPath('userData', path.join(portablePath, 'userdata'))
  app.setPath('temp', path.join(portablePath, 'tmp'))
  app.setPath('logs', path.join(portablePath, 'logs'))
}

// Load main
require('./main')
