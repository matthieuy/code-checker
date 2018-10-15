import { app, dialog, ipcMain } from 'electron'

let path = require('path')
let fs = require('fs')
let exec = require('child_process').execFile
let md5 = require('md5-file')

export default {
  tempPath: null,
  checkerPath: null,

  /**
   * Init this module
   * @returns {Promise}
   */
  init () {
    this.tempPath = app.getPath('temp')
    this.checkerPath = path.join(this.tempPath, 'codechecker.phar')

    // IPC
    ipcMain.on('phpcs-cmd', (event, obj) => {
      console.log('Receive IPC', obj)
      this.runPhpCs(event, obj)
    })
    ipcMain.on('phpcbf-cmd', (event, obj) => {
      console.log('Receive IPC', obj)
      let scanPath = this.getScanPath(obj)
      delete obj['scanFile']
      this.runCodeCheck('phpcbf', scanPath).then(() => {
        this.runPhpCs(event, obj)
      }).catch(() => {
        this.runPhpCs(event, obj)
      })
    })
    ipcMain.on('phpmd-cmd', (event, obj) => {
      let scanPath = this.getScanPath(obj)
      this.runCodeCheck('phpmd', scanPath).then((result) => {
        event.sender.send('phpmd-result', result)
      }).catch((error) => {
        console.log(error)
        event.sender.send('phpmd-result', error)
      })
    })
    ipcMain.on('phpcopy-cmd', (event, obj) => {
      let scanPath = this.getScanPath(obj)
      this.runCodeCheck('phpcpd', scanPath).then((result) => {
        event.sender.send('phpcopy-result', result)
      }).catch((error) => {
        console.log(error)
        event.sender.send('phpcopy-result', error)
      })
    })

    // Check install
    return new Promise((resolve, reject) => {
      this.installPhar()
      this.runCmd('php', ['-v'])
        .then(() => {
          resolve()
        })
        .catch(() => {
          dialog.showErrorBox(app.getName(), 'PHP doit être installé sur le poste pour que cette application fonctionne !')
          app.quit()
        })
    })
  },

  /**
   * Run PHPCS
   * @param {EventEmitter} event
   * @param {Object} project
   */
  runPhpCs (event, project) {
    this.runCodeCheck('phpcs', this.getScanPath(project)).then((result) => {
      console.log(result)
      event.sender.send('phpcs-result', result)
    }).catch((error) => {
      console.log(error)
      event.sender.send('phpcs-result', error)
    })
  },

  /**
   * Run code checker
   * @param {String} cmd
   * @param {String|Array} args
   * @return {Promise}
   */
  runCodeCheck (cmd, args) {
    if (!Array.isArray(args)) {
      args = [args]
    }
    args.unshift(cmd)
    args.unshift(this.checkerPath)

    return this.runCmd('php', args)
  },

  /**
   * Run a command
   * @param {String} cmd
   * @param {Array} args
   * @return {Promise}
   */
  runCmd (cmd, args) {
    return new Promise((resolve, reject) => {
      let options = {
        cwd: this.tempPath,
        maxBuffer: 8 * 1024 * 1024,
      }

      exec(cmd, args, options, (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout
          error.stderr = stderr
          return reject(error)
        } else {
          return resolve(stdout)
        }
      })
    })
  },

  /**
   * Get the list of scan path from ipc
   * @param project
   * @return {Array}
   */
  getScanPath (project) {
    let scanPath = []
    if (project.scanFile) {
      scanPath.push(project.scanFile)
    } else {
      project.phpPath.forEach((p) => {
        let completPath = project.path + p
        if (fs.existsSync(completPath)) {
          scanPath.push(completPath)
        }
      })
    }
    return scanPath
  },

  /**
   * Install codecheck.phar if needed
   */
  installPhar () {
    let pathSrc = path.join(global.__static, 'codechecker.phar')
    let md5Src = md5.sync(pathSrc)
    let destExist = fs.existsSync(this.checkerPath)
    let md5Dest = (destExist) ? md5.sync(this.checkerPath) : ''

    console.log('Check codechecker.phar')
    if (!destExist || md5Src !== md5Dest) {
      console.log('Create ', this.checkerPath)
      fs.copyFileSync(pathSrc, this.checkerPath)
      fs.chmodSync(this.checkerPath, '777')
    }
  },
}
