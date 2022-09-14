const {join} = require('path')

/**
 * @typedef TMDbMovie
 * @property {number} id
 * @property {string} title
 * @property {string} release_date
 */

/**
 * @typedef TMDbShow
 * @property {number} id
 * @property {string} name
 * @property {string} first_air_date
 * @property {TMDbSeason[]} seasons
 */

/**
 * @typedef TMDbSeason
 * @property {number} id
 * @property {number} season_number
 * @property {string} name
 * @property {TMDbEpisode[]} episodes
 */

/**
 * @typedef TMDbEpisode
 * @property {number} id
 * @property {number} episode_number
 * @property {string} name
 */

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function clone(value) {
  return value == undefined ? undefined : JSON.parse(JSON.stringify(value))
}

/**
 * @template T
 * @param {Promise<T> | T} value
 * @returns {Promise<T>}
 */
function immediate(value) {
  return new Promise((resolve, reject) => {
    setImmediate(() => {
      return Promise.resolve(value).then(resolve, reject)
    })
  })
}

/**
 * @param {number} number
 */
function pad(number) {
  return String(number).padStart(2, '0')
}

const TEST_TMDB_ACCESS_TOKEN = (index = 1) => `test-tmdb-access-token-${index}`
const TEST_INPUT_DIR = (index = 1) => `test-input-dir-${index}`
const TEST_MOVIES_DIR = (index = 1) => `test-movies-dir-${index}`
const TEST_SHOWS_DIR = (index = 1) => `test-shows-dir-${index}`

const TEST_YEAR = (index = 1) => `20${pad(index)}`
const TEST_MOVIE_TITLE = (index = 1) => `Test Movie ${index}`
const TEST_SHOW_TITLE = (index = 1) => `Test Show ${index}`
const TEST_EPISODE_TITLE = (index = 1) => `Test Episode ${index}`

/**
 * @typedef TestInputMovieFileOptions
 * @property {number} [year]
 * @property {boolean} [hasValidPattern]
 */

/**
 * @param {number} index
 * @param {TestInputMovieFileOptions} [options]
 */
const TEST_INPUT_MOVIE_FILE_NAME = (index = 1, options) => {
  const {year, hasValidPattern} = {year: 1, hasValidPattern: true, ...options}
  return `Test.Movie.${index}${
    hasValidPattern ? `.${TEST_YEAR(year)}` : ''
  }.mkv`
}

/**
 * @param {number} index
 * @param {TestInputMovieFileOptions} [options]
 */
const TEST_INPUT_MOVIE_FILE_PATH = (index = 1, options) =>
  join(TEST_INPUT_DIR(), TEST_INPUT_MOVIE_FILE_NAME(index, options))

const TEST_OUTPUT_MOVIE_DIR_NAME = (index = 1) =>
  `${TEST_MOVIE_TITLE(index)} (${TEST_YEAR()})`
const TEST_OUTPUT_MOVIE_DIR_PATH = (index = 1) =>
  join(TEST_MOVIES_DIR(), TEST_OUTPUT_MOVIE_DIR_NAME(index))

const TEST_OUTPUT_MOVIE_FILE_NAME = (index = 1) =>
  `${TEST_OUTPUT_MOVIE_DIR_NAME(index)}.mkv`
const TEST_OUTPUT_MOVIE_FILE_PATH = (index = 1) =>
  join(TEST_OUTPUT_MOVIE_DIR_PATH(index), TEST_OUTPUT_MOVIE_FILE_NAME(index))

/**
 * @typedef TestInputShowFilenameOptions
 * @property {number} [season]
 * @property {number} [episode]
 * @property {number} [secondEpisode]
 */

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 */
const TEST_INPUT_SHOW_FILE_NAME = (
  index = 1,
  {season, episode, secondEpisode} = {},
) => {
  const year = TEST_YEAR()
  season = pad(season != null ? season : 1)
  episode = pad(episode != null ? episode : 1)
  secondEpisode = secondEpisode != null ? `-E${pad(secondEpisode)}` : ''
  return `Test.Show.${index}.${year}.S${season}E${episode}${secondEpisode}.mkv`
}

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 */
const TEST_INPUT_SHOW_FILE_PATH = (index = 1, options) =>
  join(TEST_INPUT_DIR(), TEST_INPUT_SHOW_FILE_NAME(index, options))

const TEST_OUTPUT_SHOW_DIR_NAME = (index = 1) =>
  `${TEST_SHOW_TITLE(index)} (${TEST_YEAR()})`
const TEST_OUTPUT_SHOW_DIR_PATH = (index = 1) =>
  join(TEST_SHOWS_DIR(), TEST_OUTPUT_SHOW_DIR_NAME(index))

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 */
const TEST_OUTPUT_SHOW_SEASON_DIR_NAME = (
  index = 1, // eslint-disable-line no-unused-vars
  {season} = {season: 1},
) => `Season ${pad(season)}`

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 */
const TEST_OUTPUT_SHOW_SEASON_DIR_PATH = (index = 1, options) =>
  join(
    TEST_OUTPUT_SHOW_DIR_PATH(index),
    TEST_OUTPUT_SHOW_SEASON_DIR_NAME(index, options),
  )

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 */
const TEST_OUTPUT_SHOW_FILE_NAME = (
  index = 1,
  {season, episode, secondEpisode} = {},
) => {
  const showTitle = TEST_OUTPUT_SHOW_DIR_NAME(index)
  const episodeTitle = TEST_EPISODE_TITLE(episode)
  const secondEpisodeTitle =
    secondEpisode != null ? ` & ${TEST_EPISODE_TITLE(secondEpisode)}` : ''
  season = pad(season != null ? season : 1)
  episode = pad(episode != null ? episode : 1)
  secondEpisode = secondEpisode != null ? `-E${pad(secondEpisode)}` : ''
  return `${showTitle} - S${season}E${episode}${secondEpisode} - ${episodeTitle}${secondEpisodeTitle}.mkv`
}

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 */
const TEST_OUTPUT_SHOW_FILE_PATH = (index = 1, options) =>
  join(
    TEST_OUTPUT_SHOW_SEASON_DIR_PATH(index, options),
    TEST_OUTPUT_SHOW_FILE_NAME(index, options),
  )

const TEST_INPUT_QUESTION = message => ({
  type: 'input',
  name: 'input',
  message,
})

const TEST_CONFIRM_QUESTION = message => ({
  type: 'confirm',
  name: 'confirm',
  message,
})

const TEST_MODE_QUESTION = () => ({
  type: 'list',
  name: 'mode',
  message: 'Are you organizing movies or TV shows?',
})

const TEST_MODE_ANSWER = mode => ({
  question: TEST_MODE_QUESTION(),
  answer: mode,
})

const TEST_FILES_QUESTION = () => ({
  type: 'checkbox',
  name: 'filenames',
  message: 'Which files are you organizing?',
})

const TEST_FILES_ANSWER = filenames => ({
  question: TEST_FILES_QUESTION(),
  answer: filenames,
})

/**
 * @typedef TestMovieRenameQuestionOptions
 * @property {number} [outputIndex]
 */

/**
 * @param {number} index
 * @param {TestMovieRenameQuestionOptions & TestInputMovieFileOptions} [options]
 */
const TEST_MOVIE_RENAME_QUESTION = (index = 1, options) => {
  const {outputIndex, ...fileOptions} = {outputIndex: index, ...options}
  return TEST_CONFIRM_QUESTION(
    `Rename ${TEST_INPUT_MOVIE_FILE_NAME(
      index,
      fileOptions,
    )} to ${TEST_OUTPUT_MOVIE_FILE_PATH(outputIndex)}?`,
  )
}

/**
 * @typedef TestMovieRenameAnswerOptions
 * @property {string} answer
 */

/**
 * @param {number} index
 * @param {TestMovieRenameAnswerOptions & TestMovieRenameQuestionOptions & TestInputMovieFileOptions} [options]
 */
const TEST_MOVIE_RENAME_ANSWER = (index = 1, options) => {
  const {answer, ...questionOptions} = {answer: true, ...options}
  return {
    question: TEST_MOVIE_RENAME_QUESTION(index, questionOptions),
    answer,
  }
}

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 */
const TEST_SHOW_RENAME_QUESTION = (index = 1, options) => {
  return TEST_CONFIRM_QUESTION(
    `Rename ${TEST_INPUT_SHOW_FILE_NAME(
      index,
      options,
    )} to ${TEST_OUTPUT_SHOW_FILE_PATH(index, options)}?`,
  )
}

/**
 * @param {number} index
 * @param {TestInputShowFilenameOptions} [options]
 * @param {boolean} [answer]
 */
const TEST_SHOW_RENAME_ANSWER = (index = 1, options, answer = true) => ({
  question: TEST_SHOW_RENAME_QUESTION(index, options),
  answer,
})

/**
 * @param {string} filename
 */
const TEST_MULTIPLE_RESULTS_QUESTION = filename => ({
  type: 'list',
  name: 'choice',
  message: `Multiple results found for ${filename}. Please select one.`,
})

/**
 * @param {string} filename
 * @param {number | null} answer
 */
const TEST_MULTIPLE_RESULTS_ANSWER = (filename, answer) => ({
  question: TEST_MULTIPLE_RESULTS_QUESTION(filename),
  answer,
})

/**
 * @param {string} filename
 */
const TEST_INVALID_PATTERN_QUESTION = filename =>
  TEST_INPUT_QUESTION(
    `Unable to determine title from ${filename}. Please enter a title, or leave blank to skip:`,
  )

/**
 * @param {string} filename
 * @param {string | null} answer
 */
const TEST_INVALID_PATTERN_ANSWER = (filename, answer) => ({
  question: TEST_INVALID_PATTERN_QUESTION(filename),
  answer,
})

/**
 * @param {string | null} title
 */
const TEST_NO_RESULTS_QUESTION = title =>
  TEST_INPUT_QUESTION(
    `No results found for ${title}. Please enter a title, or leave blank to skip:`,
  )

/**
 * @param {string} title
 * @param {string | null} answer
 */
const TEST_NO_RESULTS_ANSWER = (title, answer) => ({
  question: TEST_NO_RESULTS_QUESTION(title),
  answer,
})

/**
 * @param {string} filename
 */
const TEST_SKIPPING_QUESTION = filename => ({
  type: 'list',
  name: 'choice',
  message: `Skipping ${filename}.`,
  choices: ['OK'],
})

const TEST_SKIPPING_ANSWER = filename => ({
  question: TEST_SKIPPING_QUESTION(filename),
  answer: 'OK',
})

/**
 * @param {number} index
 * @returns {TMDbMovie}
 */
const TEST_TMDB_MOVIE = (index = 1) => ({
  id: index,
  title: `Test Movie ${index}`,
  release_date: `${TEST_YEAR()}-01-${pad(index)}`,
})

/**
 * @param {number} index
 * @returns {TMDbShow}
 */
const TEST_TMDB_SHOW = (index = 1) => {
  /** @type {TMDbShow} */
  const show = {
    id: index,
    name: `Test Show ${index}`,
    first_air_date: `${TEST_YEAR()}-01-${pad(index)}`,
    seasons: [],
  }

  for (let seasonNumber = 1; seasonNumber <= 10; seasonNumber++) {
    show.seasons.push({
      id: seasonNumber,
      season_number: seasonNumber,
      name: `Season ${seasonNumber}`,
      episodes: [],
    })

    for (let episodeNumber = 1; episodeNumber <= 10; episodeNumber++) {
      show.seasons[seasonNumber - 1].episodes.push({
        id: episodeNumber,
        episode_number: episodeNumber,
        name: TEST_EPISODE_TITLE(episodeNumber),
      })
    }
  }

  return show
}

module.exports = {
  clone,
  immediate,
  TEST_TMDB_ACCESS_TOKEN,
  TEST_TMDB_MOVIE,
  TEST_TMDB_SHOW,
  TEST_INPUT_DIR,
  TEST_MOVIES_DIR,
  TEST_SHOWS_DIR,
  TEST_MOVIE_TITLE,
  TEST_INPUT_MOVIE_FILE_NAME,
  TEST_INPUT_MOVIE_FILE_PATH,
  TEST_INPUT_SHOW_FILE_NAME,
  TEST_INPUT_SHOW_FILE_PATH,
  TEST_INPUT_QUESTION,
  TEST_CONFIRM_QUESTION,
  TEST_MODE_ANSWER,
  TEST_FILES_ANSWER,
  TEST_MOVIE_RENAME_ANSWER,
  TEST_SHOW_RENAME_ANSWER,
  TEST_MULTIPLE_RESULTS_ANSWER,
  TEST_INVALID_PATTERN_ANSWER,
  TEST_NO_RESULTS_ANSWER,
  TEST_SKIPPING_ANSWER,
  TEST_OUTPUT_MOVIE_DIR_PATH,
  TEST_OUTPUT_MOVIE_FILE_PATH,
  TEST_OUTPUT_SHOW_DIR_PATH,
  TEST_OUTPUT_SHOW_SEASON_DIR_PATH,
  TEST_OUTPUT_SHOW_FILE_PATH,
}
