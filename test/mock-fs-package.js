const {normalize, sep} = require('path')
const {immediate} = require('./util')

/**
 * @typedef {Record<string, 'file' | 'directory'} MockFSEntries
 */

/**
 * @typedef MockFSMkdirOptions
 * @property {boolean} [recursive]
 */

/**
 * @typedef MockFSPackageState
 * @property {MockFSEntries} [entries]
 */

/**
 * @param {MockFSPackageState} state
 */
function createMockFSPackage(state) {
  return new MockFSPackage(state)
}

/**
 * @param {MockFSPackageState} state
 */
function createMockFSPromisesPackage(state) {
  return new MockFSPromisesPackage(state)
}

class MockFSPackage {
  /**
   * @param {MockFSPackageState} state
   */
  constructor(state) {
    if (state == null) {
      throw new Error('state is required')
    }

    /** @type {MockFSPackageState} */
    this._state = state
    if (this._state.entries == null) {
      this._state.entries = {}
    }

    /** @type {MockFSPromisesPackage} */
    this._promises = new MockFSPromisesPackage(state)
  }

  get promises() {
    return this._promises
  }
}

class MockFSPromisesPackage {
  /**
   * @param {MockFSPackageState} state
   */
  constructor(state) {
    if (state == null) {
      throw new Error('state is required')
    }

    /** @type {MockFSPackageState} */
    this._state = state
    if (this._state.entries == null) {
      this._state.entries = {}
    }
  }

  /**
   * @param {string} path
   * @param {MockFSMkdirOptions} options
   */
  async mkdir(path, {recursive} = {}) {
    path = normalize(path)

    const type = this._state.entries[path]
    if (type != null) {
      if (type === 'file') {
        throw new Error(`${path} exists and is a file`)
      } else if (type === 'directory') {
        if (!recursive) {
          throw new Error(`${path} exists and recursive is false`)
        }

        return immediate()
      }
    }

    const parentPaths = []
    const segments = path.split(sep)
    for (let i = 0; i < segments.length - 1; i++) {
      parentPaths.push(segments.slice(0, i + 1).join(sep))
    }

    const parentTypes = parentPaths
      .map(parentPath => this._state.entries[parentPath])
      .filter(type => type != null)

    if (parentTypes.some(type => type === 'file')) {
      throw new Error(`One of the parents of ${path} is a file`)
    }

    const missingParentPaths = parentPaths.filter(
      parentPath => this._state.entries[parentPath] == null,
    )

    if (missingParentPaths.length > 0 && !recursive) {
      throw new Error(
        `One or more of the parents of ${path} do not exist and recursive is false`,
      )
    }

    for (const missingParentPath of missingParentPaths) {
      this._state.entries[missingParentPath] = 'directory'
    }

    this._state.entries[path] = 'directory'

    return immediate()
  }

  /**
   * @param {string} path
   */
  async readdir(path) {
    path = normalize(path)

    const type = this._state.entries[path]
    if (type == null) {
      throw new Error(`${path} does not exist`)
    } else if (type === 'file') {
      throw new Error(`${path} is a file`)
    }

    const entries = Object.keys(this._state.entries)
    const children = entries.filter(
      entry => entry.split(sep).slice(0, -1).join(sep) === path,
    )
    const names = children.map(child => child.split(sep).pop())
    return immediate(names)
  }

  /**
   * @param {string} oldPath
   * @param {string} newPath
   */
  async rename(oldPath, newPath) {
    oldPath = normalize(oldPath)
    newPath = normalize(newPath)

    const oldType = this._state.entries[oldPath]
    if (oldType == null) {
      throw new Error(`${oldPath} does not exist`)
    }

    if (oldPath === newPath) {
      return immediate()
    }

    const newType = this._state.entries[newPath]
    if (newType != null) {
      throw new Error(`${newPath} exists`)
    }

    const newParentPath = newPath.split(sep).slice(0, -1).join(sep)
    const newParentType = this._state.entries[newParentPath]
    if (newParentType == null) {
      throw new Error(`One or more parents of ${newParentPath} do not exist`)
    } else if (newParentType === 'file') {
      throw new Error(`One of the parents of ${newParentPath} is a file`)
    }

    delete this._state.entries[oldPath]
    this._state.entries[newPath] = oldType

    return immediate()
  }
}

module.exports = {
  createMockFSPackage,
  createMockFSPromisesPackage,
}
