const {clone, immediate} = require('./util')

/**
 * @typedef MockCrossFetchPackageState
 * @property {import('./util').TMDbMovie[]} [movies]
 * @property {import('./util').TMDbShow[]} [shows]
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
    /** @type {import('./util').TMDbMovie[]} */
    this.movies = (state && state.movies) || []
    /** @type {import('./util').TMDbShow[]} */
    this.shows = (state && state.shows) || []

    this.default = this.default.bind(this)
  }

  /**
   * @param {string | URL} url
   */
  async default(url) {
    return immediate(new MockCrossFetchResponse(this, new URL(url)))
  }
}

class MockCrossFetchResponse {
  /**
   * @param {MockCrossFetchPackageState} state
   * @param {URL} url
   */
  constructor(state, url) {
    /** @type {MockCrossFetchPackage} */
    this._state = state
    /** @type {URL} */
    this._url = url

    this.url = url.href

    if (url.pathname.endsWith('/search/movie')) {
      const title = url.searchParams.get('query')
      const movies = this._state.movies.filter(movie =>
        movie.title.includes(title),
      )
      this._body = {results: movies}
      return this._ok()
    }

    if (url.pathname.endsWith('/search/tv')) {
      const title = url.searchParams.get('query')
      const shows = this._state.shows.filter(show => show.name.includes(title))
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

  async json() {
    return immediate(clone(this._body))
  }
}

module.exports = {
  createMockCrossFetchPackage,
}
