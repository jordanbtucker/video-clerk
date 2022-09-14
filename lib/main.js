const fs = require('fs')
const fsp = fs.promises
const path = require('path')
/** @type {typeof import('inquirer').default} */
const inquirer = require('inquirer')
const {default: fetch} = require('cross-fetch')
const Conf = require('conf')
const pkg = require('../package.json')

let conf
let _tmdbCache
let inputDir
let moviesDir
let showsDir
let tmdbAccessToken
let renameMK3DToMKV

/**
 * Entry point for this application.
 */
async function main() {
  try {
    handleArgs()
    await ensureConf()
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
        const names = await fsp.readdir(inputDir)
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
  // hyphens wrapped in spaces. Two episodes within the same file can be
  // specified. Examples:
  // - Harley.Quinn.S02E04.720p.mkv
  // - Harley Quinn S02E04.mkv
  // - Harley Quinn S02E04-E05.mkv
  // - Harley Quinn - S02E04.mkv
  // - Harley Quinn - S02E04-E05.mkv
  // - Peacemaker.2022.S01E02.720p.mkv
  // - Peacemaker (2022) S01E02.mkv
  // - Peacemaker (2022) S01E02-E03.mkv
  // - Peacemaker (2022) - S01E02.mkv
  const showTitleRegExp =
    /^(.+?)[. ](?:\(?(?:\d{4})\)?(?:[. ]|\s+-\s+))?S(\d\d)E(\d\d)(?:-?E(\d\d))?[. ]/i

  // TV show filenames with similar titles are matched to the same TMDb show
  // search result and stored in this object.
  const showsByFilenamePrefix = {}

  for (const filename of filenames) {
    let title
    let seasonNumber
    let episodeNumber
    let secondEpisodeNumber

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
        secondEpisodeNumber =
          filenameMatch[4] != null ? Number(filenameMatch[4]) : undefined
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
      const searchData = await fetchTMdb(searchPathname, {query: title})
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
        const showData = await fetchTMdb(`tv/${result.id}`)
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
        const seasonData = await fetchTMdb(
          `tv/${result.id}/season/${seasonNumber}`,
        )

        let episodeID
        let secondEpisodeID

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

        // If a second episode was matched, ensure that the episode number
        // matched in the filename exists in the database.
        if (secondEpisodeNumber != null) {
          const secondEpisodeData = seasonData.episodes.find(
            e => e.episode_number === secondEpisodeNumber,
          )

          if (secondEpisodeData) {
            secondEpisodeID = secondEpisodeData.id
          }
        }

        // If the episode number wasn't matched, or if the matched episode
        // number doesn't exist in the database, prompt the user to choose the
        // correct episode.
        if (episodeID == null) {
          episodeNumber = await promptList(
            `Unable to determine ${
              secondEpisodeNumber != null ? 'first ' : ''
            }episode for ${filename}. Please choose one.`,
            seasonData.episodes.map(e => ({
              name: `${pad(e.episode_number)} ${e.name}`,
              value: e.episode_number,
            })),
          )
        }

        // If the second episode number wasn't matched, or if the matched
        // episode number doesn't exist in the database, prompt the user to
        // choose the correct episode.
        if (secondEpisodeID == null && secondEpisodeNumber != null) {
          secondEpisodeNumber = await promptList(
            `Unable to determine second episode for ${filename}. Please choose one.`,
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

        // If a second episode was matched, add its name to the episode title.
        if (secondEpisodeID != null) {
          episodeTitle += ` & ${scrubTitle(
            seasonData.episodes.find(
              e => e.episode_number === secondEpisodeNumber,
            ).name,
          )}`
        }
      }

      // Remove or replace any invalid path characters in the movie or show title.
      title = scrubTitle(title)

      // Get the release year for the movie from the database, regarless of
      // the year in the filename.
      let year
      if (isMovieMode) {
        year = result.release_date.match(/^(\d{4})-/)[1]
      } else {
        year = result.first_air_date.match(/^(\d{4})-/)[1]
      }

      // This application uses the Plex filename formatting scheme.
      // For movies: <movies-dir>/<title> (<year>)/<title> (<year>).<ext>
      // Example: /movies/The Dark Knight (2008)/The Dark Knight (2008).mkv
      // For TV shows: <tv-shows-dir>/<show-title> (<year>)/Season <season>/<show-title> (<year>) - S<season>E<episode> - <episode-title>.<ext>
      // Example: tv/Harley Quinn (2019)/Season 02/Harley Quinn (2019) - S02E04 - Thawing Hearts.mkv
      const originalExt = path.extname(filename)

      // Rename *.mk3d files to *.mkv if configured to do so.
      const ext =
        originalExt.toLowerCase() === '.mk3d' && renameMK3DToMKV
          ? '.mkv'
          : originalExt

      const source = path.join(inputDir, filename)
      const destination = isMovieMode
        ? path.join(moviesDir, `${title} (${year})`, `${title} (${year})${ext}`)
        : path.join(
            showsDir,
            `${title} (${year})`,
            `Season ${pad(seasonNumber)}`,
            `${title} (${year}) - S${pad(seasonNumber)}E${pad(episodeNumber)}${
              secondEpisodeNumber != null ? `-E${pad(secondEpisodeNumber)}` : ''
            } - ${episodeTitle}${ext}`,
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
async function ensureConf() {
  conf = new Conf()

  // An API Read Access Token (v4 auth) is required to access TMDb API.
  if (!tmdbAccessToken) {
    tmdbAccessToken = conf.get('tmdbAccessToken')
  }
  if (!tmdbAccessToken) {
    tmdbAccessToken = await promptInput(
      'Please visit https://www.themoviedb.org/settings/api to acquire an API Read Access Token (v4 auth) and enter it here:',
    )

    if (!tmdbAccessToken) {
      const err = new Error('No access token')
      err.type = 'no-access-token'
      throw err
    }

    conf.set('tmdbAccessToken', tmdbAccessToken)
  }

  // The input directory is where this application looks for new video files.
  if (!inputDir) {
    inputDir = conf.get('inputDir')
  }
  if (!inputDir) {
    inputDir = await promptInput(
      'In what folder are the files you want to rename?',
    )
    if (!inputDir) {
      const err = new Error('No input dir')
      err.type = 'no-input-dir'
      throw err
    }

    conf.set('inputDir', inputDir)
  }

  // The movies directory is where the application will put renamed movie files.
  if (!moviesDir) {
    moviesDir = conf.get('moviesDir')
  }
  if (!moviesDir) {
    moviesDir = await promptInput(
      'In what folder does your movie library reside?',
    )
    if (!moviesDir) {
      const err = new Error('No movies dir')
      err.type = 'no-movies-dir'
      throw err
    }

    conf.set('moviesDir', moviesDir)
  }

  // The TV shows directory is where this application will put renamed TV show files.
  if (!showsDir) {
    showsDir = conf.get('showsDir')
  }
  if (!showsDir) {
    showsDir = await promptInput(
      'In what folder does your TV show library reside?',
    )
    if (!showsDir) {
      const err = new Error('No shows dir')
      err.type = 'no-shows-dir'
      throw err
    }

    conf.set('showsDir', showsDir)
  }

  // The rename MK3D to MKV setting changes the file extension of *.mk3d file to *.mkv.
  // Plex does not support the *.mk3d file extension, so this is a workaround.
  if (renameMK3DToMKV == null) {
    renameMK3DToMKV = conf.get('renameMK3DToMKV')
  }
  if (renameMK3DToMKV == null) {
    renameMK3DToMKV = await promptConfirm(
      'Do you want to rename *.mk3d files to *.mkv? (Plex does not support the *.mk3d file extension.)',
    )
    if (renameMK3DToMKV == null) {
      const err = new Error('No value for rename MK3D to MKV setting')
      err.type = 'no-rename-mk3d-to-mkv'
      throw err
    }

    conf.set('renameMK3DToMKV', renameMK3DToMKV)
  }
}

/**
 * Handle command line arguments.
 */
function handleArgs() {
  const args = process.argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--help':
        displayHelp()
        // eslint-disable-next-line no-process-exit
        process.exit()
        break
      case '--token':
        tmdbAccessToken = args[++i]
        break
      case '--input':
        inputDir = args[++i]
        break
      case '--movies':
        moviesDir = args[++i]
        break
      case '--shows':
        showsDir = args[++i]
        break
      case '--no-mk3d-to-mkv':
        renameMK3DToMKV = false
        break
      default:
        throw new Error(`Unknown option ${arg}`)
    }
  }
}

/**
 * Displays help information.
 */
function displayHelp() {
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
function getTMDbCache() {
  if (_tmdbCache == null) {
    _tmdbCache = {}
  }

  return _tmdbCache
}

/**
 *
 * @param {string} pathname The API path relative to the API root
 * @param {URLSearchParams} params Any query parameters for the request
 * @returns {string} An ID that represents this request for caching
 */
function getTMdbCacheID(pathname, params) {
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
async function fetchTMdb(pathname, params) {
  // Get the result data from the cache if it exists.
  const cacheID = getTMdbCacheID(pathname, params)
  const tmdbCache = getTMDbCache()
  let data = tmdbCache[cacheID]
  if (data != null) {
    return data
  }

  const url = new URL(pathname, 'https://api.themoviedb.org/3/')
  for (const name in params) {
    url.searchParams.set(name, params[name])
  }

  const res = await fetch(url.toString(), {
    headers: {Authorization: `Bearer ${tmdbAccessToken}`},
  })

  // Store the result in the cache.
  data = await res.json()
  tmdbCache[cacheID] = data
  return data
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
    {
      type: 'list',
      name: 'choice',
      message,
      choices,
    },
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
    {
      type: 'confirm',
      name: 'confirm',
      message,
    },
  ])

  return confirm
}

module.exports = {
  main,
}
