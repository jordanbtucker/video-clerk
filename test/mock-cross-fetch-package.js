const {clone, immediate} = require('./util')

/**
 * @typedef MockCrossFetchPackageState
 * @property {import('./util').TMDbMovie[]} [movies]
 * @property {import('./util').TMDbShow[]} [shows]
 * @property {boolean} [returnMultipleResults]
 * @property {string | boolean} [error]
 */

/**
 * @param {MockCrossFetchPackageState} [state]
 */
function createMockCrossFetchPackage(state) {
  return new MockCrossFetchPackage(state)
}

class MockCrossFetchPackage {
  /**
   * @param {MockCrossFetchPackageState} state
   */
  constructor(state) {
    /** @type {MockCrossFetchPackageState} */
    this._state = state || {movies: [], shows: []}

    this.default = this.default.bind(this)
  }

  /**
   * @param {string | URL} url
   */
  async default(url) {
    return immediate(new MockCrossFetchResponse(this._state, new URL(url)))
  }
}

class MockCrossFetchResponse {
  /**
   * @param {MockCrossFetchPackageState} state
   * @param {URL} url
   */
  constructor(state, url) {
    /** @type {MockCrossFetchPackageState} */
    this._state = state
    /** @type {URL} */
    this._url = url

    if (this._state.error != null) {
      this._body = {
        success: false,
        status_code: 1,
      }

      if (typeof this._state.error === 'string') {
        this._body.status_message = this._state.error
      }

      return this._error()
    }

    this.url = url.href

    if (url.pathname.endsWith('/search/movie')) {
      const title = url.searchParams.get('query')
      const movies = this._state.movies.filter(movie =>
        this._state.returnMultipleResults ? true : movie.title.includes(title),
      )
      this._body = {results: movies}
      return this._ok()
    }

    if (url.pathname.endsWith('/search/tv')) {
      const title = url.searchParams.get('query')
      const shows = this._state.shows.filter(show =>
        this._state.returnMultipleResults ? true : show.name.includes(title),
      )
      this._body = {results: shows}
      return this._ok()
    }

    const tvMatch = url.pathname.match(/\/tv\/(\d+)$/)
    if (tvMatch != null) {
      const id = Number(tvMatch[1])

      const show = this._state.shows.find(show => show.id === id)
      if (show == null) {
        return this._notFound()
      }

      this._body = show
      return this._ok()
    }

    const seasonMatch = url.pathname.match(/\/tv\/(\d+)\/season\/(\d+)$/)
    if (seasonMatch != null) {
      const id = Number(seasonMatch[1])
      const seasonNumber = Number(seasonMatch[2])

      const show = this._state.shows.find(show => show.id === id)
      if (show == null) {
        return this._notFound()
      }

      const season = show.seasons.find(
        season => season.season_number === seasonNumber,
      )
      if (season == null) {
        return this._notFound()
      }

      this._body = season
      return this._ok()
    }

    this._notFound()
  }

  _ok() {
    this.ok = true
    this.status = 200
    this.statusText = 'OK'
  }

  _notFound() {
    this.ok = false
    this.status = 404
    this.statusText = 'Not Found'
  }

  _error() {
    this.ok = false
    this.status = 500
    this.statusText = 'Internal Server Error'
  }

  async json() {
    return immediate(clone(this._body))
  }
}

module.exports = {
  createMockCrossFetchPackage,
}
