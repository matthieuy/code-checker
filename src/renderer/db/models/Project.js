import { Document } from 'camo'
import fs from 'fs'
import glob from 'glob'

/**
 * Class Project
 */
class Project extends Document {
  /**
   * Constructor
   * Definr the schema of Project
   */
  constructor () {
    super()
    this.schema({
      name: {
        type: String,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
      phpPath: [String],
      favicon: {
        type: String,
        default: null,
      },
      lastUpdate: {
        type: Date,
        default: new Date(),
      },
      // PHP CS
      csDate: Date,
      csErrors: Number,
      csWarnings: Number,
      csFixable: Number,
      // PHP MD
      mdDate: Date,
      mdErrors: Number,
      mdWarnings: Number,
      // PHP CPD
      copyDate: Date,
      copyWarnings: Number,
    })
  }

  /**
   * Hook before save project
   */
  preSave () {
    this.lastUpdate = new Date()

    // First save : try to detect PHP directories
    if (!this._id) {
      if (fs.existsSync(this.path + '/src')) {
        this.phpPath.push('/src')
      }
      if (fs.existsSync(this.path + '/application')) {
        this.phpPath.push('/application')
      }
      if (!this.phpPath.length) {
        this.phpPath.push('/')
      }
    }

    // Favicon
    if (!this.favicon || !fs.existsSync(this.path + this.favicon)) {
      this.favicon = null
      let find = glob.sync('**/*.ico', {
        cwd: this.path,
        dot: false,
        nodir: true,
        ignore: 'vendor/**',
      })
      if (find.length) {
        this.favicon = '/' + find[0]
      }
    }
  }

  isExist () {
    return fs.existsSync(this.path)
  }

  /**
   * Get project list
   * @return {Promise}
   */
  static getList () {
    return this.find({}, { sort: '-lastUpdate' })
  }

  /**
   * Update PHP MD stats
   * @param {String} id
   * @param {Integer} warnings
   * @param {Integer} errors
   * @return {Promise}
   */
  static updateMD (id, warnings, errors) {
    return this.findOne({ _id: id }).then((project) => {
      project.mdDate = new Date()
      project.mdWarnings = warnings
      project.mdErrors = errors
      return project.save()
    })
  }

  /**
   * Update PHP CS stats
   * @param {String} id
   * @param {Object} totals
   * @return {Promise}
   */
  static updateCS (id, totals) {
    return this.findOne({ _id: id }).then((project) => {
      project.csDate = new Date()
      project.csErrors = (totals.errors) ? totals.errors : 0
      project.csWarnings = (totals.warnings) ? totals.warnings : 0
      project.csFixable = (totals.fixable) ? totals.fixable : 0
      return project.save()
    })
  }

  /**
   * Update PHP CPD
   * @param {String} id
   * @param {Integer} warnings
   * @return {Promise}
   */
  static updateCopy (id, warnings) {
    return this.findOne({ _id: id }).then((project) => {
      project.copyDate = new Date()
      project.copyWarnings = warnings
      return project.save()
    })
  }

  /**
   * Get the collection name
   * @returns {string}
   */
  static collectionName () {
    return 'projects'
  }
}

export default Project
