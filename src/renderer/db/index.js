import camo from 'camo'
import { remote } from 'electron'
import Cache from './cache'

// Load models
import Project from './models/Project'

let Database = function () {
  this._database = null

  /**
   * Init the database
   * @return {Promise}
   */
  this.init = () => {
    if (!this._database) {
      return new Promise((resolve, reject) => {
        let url = 'nedb://' + remote.app.getPath('userData')
        console.info(`[DB] Stock in "${url}"`)
        camo.connect(url).then((db) => {
          this._database = db
          console.info('[DB] Database loaded')
          setTimeout(this.compact, 5000)
          resolve()
        })
      })
    }
  }

  /**
   * Set the interval to compress DB
   */
  this.compact = () => {
    global.dbCollection = camo.getClient().driver()
    for (let collection in global.dbCollection) {
      if (global.dbCollection.hasOwnProperty(collection)) {
        global.dbCollection[collection].persistence.setAutocompactionInterval(1000 * 60 * 60)
        global.dbCollection[collection].on('compaction.done', () => {
          console.log(`[DB] "${collection}" : Compaction done`)
        })
      }
    }
  }
}

// Exports
export { Project, Cache }
export default new Database()
