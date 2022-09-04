const fs = require('fs')
const fsp = fs.promises
const path = require('path')
const inquirer = require('inquirer')
const {default: fetch} = require('cross-fetch')
const Conf = require('conf')
const pkg = require('../package.json')

class App {
  /**
   * Entry point for this application.
   */
  async run() {
    try {
      this.handleArgs()
      await this.ensureConf()
    } catch (err) {
      // Errors that contain a type property occur when the user enters nothing,
      // so we just exit the app. Otherwise, we throw the unknown error.
      if (err.type) {
        process.exitCode = 1
        return
      }

      throw err
    }

    // The mode is either Movies or TV.
    // Filenames are movie files found in the input directory.
    const {mode, filenames} = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Are you organizing movies or TV shows?',
        choices: [
          {name: 'Movies', value: 'movies'},
          {name: 'TV Shows', value: 'tv'},
        ],
      },
      {
        type: 'checkbox',
        name: 'filenames',
        message: 'Which files are you organizing?',
        choices: async () => {
          const names = await fsp.readdir(this.inputDir)
          return names
            .filter(n =>
              n.match(
                /\.(avi|flv|m4[pv]|mp([24egv]|eg)|mk(3d|v)|ogg|swf|webm|wmv)$/i,
              ),
            )
            .sort()
        },
      },
    ])

    const isMovieMode = mode === 'movies'

    // Movie filenames are matched by a title followed by a year, optionally
    // surrounded by parenetheses, and separated by dots or spaces. Examples:
    // - The.Dark.Knight.2008.1080p.mkv
    // - The Dark Knight (2008).mkv
    const movieTitleRegExp = /^(.+)[. ]\(?(\d{4})\)?[. ]/

    // TV show filenames are matched by a title followed by an optional year
    // followed by a season and episode number separated by dots, spaces, or
    // hyphens wrapped in spaces. Examples:
    // - Harley.Quinn.S02E04.720p.mkv
    // - Harley Quinn S02E04.mkv
    // - Harley Quinn - S02E04.mkv
    // - Peacemaker.2022.S01E02.720p.mkv
    // - Peacemaker (2022) S01E02.mkv
    // - Peacemaker (2022) - S01E02.mkv
    const showTitleRegExp =
      /^(.+?)[. ](?:\(?(?:\d{4})\)?(?:[. ]|\s+-\s+))?S(\d\d)E(\d\d)[. ]/i

    // TV show filenames with similar titles are matched to the same TMDb show
    // search result and stored in this object.
    const showsByFilenamePrefix = {}

    for (const filename of filenames) {
      let title
      let seasonNumber
      let episodeNumber

      let result
      const titleRegExp = isMovieMode ? movieTitleRegExp : showTitleRegExp
      const filenameMatch = titleRegExp.exec(filename)
      if (filenameMatch) {
        // This this TV show has already been matched with a similar filename,
        // use it.
        if (!isMovieMode) {
          result = showsByFilenamePrefix[filenameMatch[1]]
        }

        // Replace the dots with spaces in the title before searching for it on
        // TMDb.
        title = filenameMatch[1].replace(/\./g, ' ')
        if (!isMovieMode) {
          seasonNumber = Number(filenameMatch[2])
          episodeNumber = Number(filenameMatch[3])
        }
      } else {
        // If a title could not be matched from the filename, prompt the user to
        // enter it manually.
        title = await promptInput(
          `Unable to determine title from ${filename}. Please enter a title.`,
        )
      }

      if (result == null) {
        const searchPathname = isMovieMode ? 'search/movie' : 'search/tv'
        const searchData = await this.fetchTMdb(searchPathname, {query: title})
        if (searchData.results && searchData.results.length) {
          // If only one result is returned, assume it's the correct one.
          if (searchData.results.length === 1) {
            result = searchData.results[0]
          } else {
            // Otherwise, prompt to user to choose the correct result. Include the
            // movie release date or TV show first air date to help the user
            // choose the correct result.
            const resultID = await promptList(
              `Multiple results found for ${filename}. Please select one.`,
              searchData.results.map(r => ({
                name: isMovieMode
                  ? `${r.title} (${r.release_date})`
                  : `${r.name} (${r.first_air_date})`,
                value: r.id,
              })),
            )

            result = searchData.results.find(r => r.id === resultID)
          }

          // Store the TV show result with the filename prefix.
          if (!isMovieMode && filenameMatch) {
            showsByFilenamePrefix[filenameMatch[1]] = result
          }
        }
      }

      if (result != null) {
        let episodeTitle
        if (isMovieMode) {
          // Get the title of the movie from the database result.
          title = result.title
        } else {
          // Get the title of the show from the database result.
          title = result.name

          // Fetch the show data, including the list of seasons.
          const showData = await this.fetchTMdb(`tv/${result.id}`)
          let seasonID

          // Ensure that the season number matched in the filename exists in the
          // database.
          if (seasonNumber != null) {
            const seasonData = showData.seasons.find(
              s => s.season_number === seasonNumber,
            )

            if (seasonData) {
              seasonID = seasonData.id
            }
          }

          // If the season number wasn't matched, or if the matched season
          // number doesn't exist in the database, prompt the user to choose the
          // correct season.
          if (seasonID == null) {
            seasonNumber = await promptList(
              `Unable to determine season for ${filename}. Please choose one.`,
              showData.seasons.map(s => ({
                name: s.name,
                value: s.season_number,
              })),
            )
          }

          // Fetch the season data, including the list of episodes.
          const seasonData = await this.fetchTMdb(
            `tv/${result.id}/season/${seasonNumber}`,
          )

          let episodeID

          // Ensure that the episode number matched in the filename exists in
          // the database.
          if (episodeNumber != null) {
            const episodeData = seasonData.episodes.find(
              e => e.episode_number === episodeNumber,
            )

            if (episodeData) {
              episodeID = episodeData.id
            }
          }

          // If the episode number wasn't matched, or if the matched episode
          // number doesn't exist in the database, prompt the user to choose the
          // correct episode.
          if (episodeID == null) {
            episodeNumber = await promptList(
              `Unabled to determine episode for ${filename}. Please choose one.`,
              seasonData.episodes.map(e => ({
                name: `${pad(e.episode_number)} ${e.name}`,
                value: e.episode_number,
              })),
            )
          }

          // Remove or replace any invalid path characters in the episode title.
          episodeTitle = scrubTitle(
            seasonData.episodes.find(e => e.episode_number === episodeNumber)
              .name,
          )
        }

        // Remove or replace any invalid path characters in the movie or show title.
        title = scrubTitle(title)

        // Get the release year for the movie from the database, regarless of
        // the year in the filename.
        let year
        if (isMovieMode) {
          year = result.release_date.match(/^(\d{4})-/)[1]
        }

        // This application uses the Plex filename formatting scheme.
        // For movies: <movies-dir>/<title> (<year>)/<title> (<year>).<ext>
        // Example: /movies/The Dark Knight (2008)/The Dark Knight (2008).mkv
        // For TV shows: <tv-shows-dir>/<show-title>/Season <season>/<show-title> - S<season>E<episode> - <episode-title>.<ext>
        // Example: tv/Harley Quinn/Season 02/Harley Quinn - S02E04 - Thawing Hearts.mkv
        const originalExt = path.extname(filename)

        // Rename *.mk3d files to *.mkv if configured to do so.
        const ext =
          originalExt.toLowerCase() === '.mk3d' && this.renameMK3DToMKV
            ? '.mkv'
            : originalExt

        const source = path.join(this.inputDir, filename)
        const destination = isMovieMode
          ? path.join(
              this.moviesDir,
              `${title} (${year})`,
              `${title} (${year})${ext}`,
            )
          : path.join(
              this.showsDir,
              title,
              `Season ${pad(seasonNumber)}`,
              `${title} - S${pad(seasonNumber)}E${pad(
                episodeNumber,
              )} - ${episodeTitle}${ext}`,
            )

        // Confirm with the user before each rename.
        const renameConfirm = await promptConfirm(
          `Rename ${filename} to ${destination}?`,
        )

        if (renameConfirm) {
          await fsp.mkdir(path.dirname(destination), {recursive: true})
          await fsp.rename(source, destination)
        }
      } else {
        // If no results were found for the movie or TV show, inform the user
        // and continue to the next file.
        await promptList(`No results found for ${title}.`, ['OK'])
      }
    }
  }

  /**
   * Ensures that the necessary configuration exists.
   */
  async ensureConf() {
    this.conf = new Conf()

    // An API Read Access Token (v4 auth) is required to access TMDb API.
    if (!this.tmdbAccessToken) {
      this.tmdbAccessToken = this.conf.get('tmdbAccessToken')
    }
    if (!this.tmdbAccessToken) {
      this.tmdbAccessToken = await promptInput(
        'Please visit https://www.themoviedb.org/settings/api to acquire an API Read Access Token (v4 auth) and enter it here:',
      )

      if (!this.tmdbAccessToken) {
        const err = new Error('No access token')
        err.type = 'no-access-token'
        throw err
      }

      this.conf.set('tmdbAccessToken', this.tmdbAccessToken)
    }

    // The input directory is where this application looks for new video files.
    if (!this.inputDir) {
      this.inputDir = this.conf.get('inputDir')
    }
    if (!this.inputDir) {
      this.inputDir = await promptInput(
        'In what folder are the files you want to rename?',
      )
      if (!this.inputDir) {
        const err = new Error('No input dir')
        err.type = 'no-input-dir'
        throw err
      }

      this.conf.set('inputDir', this.inputDir)
    }

    // The movies directory is where the application will put renamed movie files.
    if (!this.moviesDir) {
      this.moviesDir = this.conf.get('moviesDir')
    }
    if (!this.moviesDir) {
      this.moviesDir = await promptInput(
        'In what folder does your movie library reside?',
      )
      if (!this.moviesDir) {
        const err = new Error('No movies dir')
        err.type = 'no-movies-dir'
        throw err
      }

      this.conf.set('moviesDir', this.moviesDir)
    }

    // The TV shows directory is where this application will put renamed TV show files.
    if (!this.showsDir) {
      this.showsDir = this.conf.get('showsDir')
    }
    if (!this.showsDir) {
      this.showsDir = await promptInput(
        'In what folder does your TV show library reside?',
      )
      if (!this.showsDir) {
        const err = new Error('No shows dir')
        err.type = 'no-shows-dir'
        throw err
      }

      this.conf.set('showsDir', this.showsDir)
    }

    // The rename MK3D to MKV setting changes the file extension of *.mk3d file to *.mkv.
    // Plex does not support the *.mk3d file extension, so this is a workaround.
    if (this.renameMK3DToMKV == null) {
      this.renameMK3DToMKV = this.conf.get('renameMK3DToMKV')
    }
    if (this.renameMK3DToMKV == null) {
      this.renameMK3DToMKV = await promptConfirm(
        'Do you want to rename *.mk3d files to *.mkv? (Plex does not support the *.mk3d file extension.)',
      )
      if (this.renameMK3DToMKV == null) {
        const err = new Error('No value for rename MK3D to MKV setting')
        err.type = 'no-rename-mk3d-to-mkv'
        throw err
      }

      this.conf.set('renameMK3DToMKV', this.renameMK3DToMKV)
    }
  }

  /**
   * Handle command line arguments.
   */
  handleArgs() {
    const args = process.argv.slice(2)
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      switch (arg) {
        case '--help':
          this.displayHelp()
          // eslint-disable-next-line no-process-exit
          process.exit()
          break
        case '--token':
          this.tmdbAccessToken = args[++i]
          break
        case '--input':
          this.inputDir = args[++i]
          break
        case '--movies':
          this.moviesDir = args[++i]
          break
        case '--shows':
          this.showsDir = args[++i]
          break
        case '--no-mk3d-to-mkv':
          this.renameMK3DToMKV = false
          break
        default:
          throw new Error(`Unknown option ${arg}`)
      }
    }
  }

  /**
   * Displays help information.
   */
  displayHelp() {
    console.log(`${pkg.name} v${pkg.version}

Usage: ${pkg.name} [options]

Options:
  --help            Displays this message
  --token           The Movie Database access token
  --input           The input folder
  --movies          The movies folder
  --shows           The TV shows folder
  --no-mk3d-to-mkv  Do not rename *.mk3d files to *.mkv`)
  }

  /**
   * Gets a cache object for TMdb results.
   */
  get tmdbCache() {
    if (this._tmdbCache == null) {
      this._tmdbCache = {}
    }

    return this._tmdbCache
  }

  /**
   *
   * @param {string} pathname The API path relative to the API root
   * @param {URLSearchParams} params Any query parameters for the request
   * @returns {string} An ID that represents this request for caching
   */
  getTMdbCacheID(pathname, params) {
    // Cache IDs are JSON arrays with the first element as the pathname and the
    // second element as an array of params sorted by key.
    return JSON.stringify([
      pathname,
      Object.keys(params || {})
        .sort()
        .map(key => [key, params[key]]),
    ])
  }

  /**
   * Fetches data from TMDb.
   * @param {string} pathname The API path relative to the API root
   * @param {URLSearchParams} params Any query parameters for the request
   * @returns {Promise<any>} A promise that resolves to the data returned from TMDb
   */
  async fetchTMdb(pathname, params) {
    // Get the result data from the cache if it exists.
    const cacheID = this.getTMdbCacheID(pathname, params)
    let data = this.tmdbCache[cacheID]
    if (data != null) {
      return data
    }

    const url = new URL(pathname, 'https://api.themoviedb.org/3/')
    for (const name in params) {
      url.searchParams.set(name, params[name])
    }

    const res = await fetch(url.toString(), {
      headers: {Authorization: `Bearer ${this.tmdbAccessToken}`},
    })

    // Store the result in the cache.
    data = await res.json()
    this.tmdbCache[cacheID] = data
    return data
  }
}

/**
 * Removes invalid path characters from a title.
 * @param {string} title The title to scrub
 * @returns {string} The scrubbed title
 */
function scrubTitle(title) {
  // Invalid Windows characters include: \ / : * ? " < > |
  // Invalid POSIX characters include: / and \0
  return title
    .replace(/[\\/]/g, '-')
    .replace(/[:|] ?/g, ' - ')
    .replace(/[*?"<>\0]/g, '')
}

/**
 * Pads a season or episode number with a leading zero if needed.
 * @param {number} number The season or episode number to pad
 * @returns {number} The padded season or episode number
 */
function pad(number) {
  return number.toString().padStart(2, '0')
}

/**
 * Prompts the user for an input string.
 * @param {string} message The message to give when prompting
 * @returns {Promise<string>} A promise that resolves to the input string given by the user
 */
async function promptInput(message) {
  const {input} = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message,
    },
  ])

  return input
}

/**
 * Prompts the user with a list of choices.
 * @param {string} message The message to give when prompting
 * @param {array|function} choices The list of choices to give the user
 * @returns {Promise<any>} A promise that resolves to the choice made by the user
 */
async function promptList(message, choices) {
  const {choice} = await inquirer.prompt([
    {type: 'list', name: 'choice', message, choices},
  ])

  return choice
}

/**
 * Prompts the user with confirmation message.
 * @param {string} message The message to give when prompting
 * @returns {Promise<boolean>} A promise that resolves to the answer given by the user
 */
async function promptConfirm(message) {
  const {confirm} = await inquirer.prompt([
    {type: 'confirm', name: 'confirm', message},
  ])

  return confirm
}

module.exports = App
