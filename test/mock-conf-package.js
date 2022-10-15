/**
 * @typedef MockConfPackageState
 * @property {Record<string, unknown>} [values]
 */

/**
 * @param {MockConfPackageState} [state]
 */
function createMockConfPackage(state) {
  return class extends MockConfPackage {
    constructor() {
      super(state, ...arguments)
    }
  }
}

class MockConfPackage {
  /**
   * @param {MockConfPackageState} [state]
   */
  constructor(state) {
    /** @type {Record<string, unknown>} */
    this._values = (state && state.values) || {}
  }

  /**
   * @param {string} key
   */
  get(key) {
    return this._values[key]
  }

  /**
   * @param {string} key
   * @param {unknown} value
   */
  set(key, value) {
    if (typeof value === 'object' && value !== null) {
      for (const [k, v] of Object.entries(value)) {
        this.set(`${key}.${k}`, v)
      }
    } else if (value === undefined) {
      delete this._values[key]
    } else {
      this._values[key] = value
    }
  }

  clear() {
    for (const key of Object.keys(this._values)) {
      delete this._values[key]
    }
  }
}

module.exports = {
  createMockConfPackage,
}
