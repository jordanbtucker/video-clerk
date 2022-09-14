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

  get(key) {
    return this._values[key]
  }

  set(key, value) {
    this._values[key] = value
  }
}

module.exports = {
  createMockConfPackage,
}
