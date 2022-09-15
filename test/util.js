const {join} = require('path')

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

const TEST_TMDB_ACCESS_TOKEN = 'test-tmdb-access-token'
const TEST_INPUT_DIR = 'test-input-dir'
const TEST_MOVIES_DIR = 'test-movies-dir'
const TEST_SHOWS_DIR = 'test-shows-dir'
const TEST_YEAR = '2000'

const TEST_MOVIE_TITLE = (index = 1) => `Test Movie ${index}`
const TEST_SHOW_TITLE = (index = 1) => `Test Show ${index}`
const TEST_EPISODE_TITLE = (index = 1) => `Test Episode ${index}`

/**
 * @typedef TMDbMovie
 * @property {number} id
 * @property {string} title
 * @property {string} release_date
 */

/**
 * @param {number} index
 * @returns {TMDbMovie}
 */
const TEST_TMDB_MOVIE = (index = 1) => ({
  id: index,
  title: `Test Movie ${index}`,
  release_date: `${TEST_YEAR}-01-${pad(index)}`,
})

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
 * @param {number} index
 * @returns {TMDbShow}
 */
const TEST_TMDB_SHOW = (index = 1) => {
  /** @type {TMDbShow} */
  const show = {
    id: index,
    name: `Test Show ${index}`,
    first_air_date: `${TEST_YEAR}-01-${pad(index)}`,
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

const TEST_LIST_QUESTION = (message, name = 'choice') => ({
  type: 'list',
  name,
  message,
})

const TEST_TMDB_ACCESS_TOKEN_QUESTION = () =>
  TEST_INPUT_QUESTION(
    'Please visit https://www.themoviedb.org/settings/api to acquire an API Read Access Token (v4 auth) and enter it here:',
  )

/**
 * @param {string | null} answer
 */
const TEST_TMDB_ACCESS_TOKEN_ANSWER = (answer = TEST_TMDB_ACCESS_TOKEN) => ({
  question: TEST_TMDB_ACCESS_TOKEN_QUESTION(),
  answer,
})

const TEST_INPUT_DIR_QUESTION = () =>
  TEST_INPUT_QUESTION('In what folder are the files you want to rename?')

/**
 * @param {string | null} answer
 */
const TEST_INPUT_DIR_ANSWER = (answer = TEST_INPUT_DIR) => ({
  question: TEST_INPUT_DIR_QUESTION(),
  answer,
})

const TEST_MOVIES_DIR_QUESTION = () =>
  TEST_INPUT_QUESTION('In what folder does your movie library reside?')

/**
 * @param {string | null} answer
 */
const TEST_MOVIES_DIR_ANSWER = (answer = TEST_MOVIES_DIR) => ({
  question: TEST_MOVIES_DIR_QUESTION(),
  answer,
})

const TEST_SHOWS_DIR_QUESTION = () =>
  TEST_INPUT_QUESTION('In what folder does your TV show library reside?')

/**
 * @param {string | null} answer
 */
const TEST_SHOWS_DIR_ANSWER = (answer = TEST_SHOWS_DIR) => ({
  question: TEST_SHOWS_DIR_QUESTION(),
  answer,
})

const TEST_RENAME_MK3D_FILES_QUESTION = () =>
  TEST_CONFIRM_QUESTION(
    'Do you want to rename *.mk3d files to *.mkv? (Plex does not support the *.mk3d file extension.)',
  )

/**
 * @param {boolean | null} answer
 */
const TEST_RENAME_MK3D_FILES_ANSWER = (answer = true) => ({
  question: TEST_RENAME_MK3D_FILES_QUESTION(),
  answer,
})

const TEST_MODE_QUESTION = () =>
  TEST_LIST_QUESTION('Are you organizing movies or TV shows?', 'mode')

/**
 * @param {'movies' | 'tv'} answer
 */
const TEST_MODE_ANSWER = answer => ({
  question: TEST_MODE_QUESTION(),
  answer,
})

const TEST_FILES_QUESTION = () => ({
  type: 'checkbox',
  name: 'filenames',
  message: 'Which files are you organizing?',
})

/**
 * @param {string[]} filenames
 */
const TEST_FILES_ANSWER = filenames => ({
  question: TEST_FILES_QUESTION(),
  answer: filenames,
})

/**
 * @typedef TestInputFileOptions
 * @property {string} [extension]
 * @property {boolean} [hasValidPattern]
 */

/**
 * @param {number} index
 * @param {TestInputFileOptions} [options]
 */
const TEST_INPUT_MOVIE_FILE_NAME = (index = 1, options) => {
  const {hasValidPattern, extension} = {
    extension: '.mkv',
    hasValidPattern: true,
    ...options,
  }
  return `Test.Movie.${index}${
    hasValidPattern ? `.${TEST_YEAR}` : ''
  }${extension}`
}

/**
 * @param {number} index
 * @param {TestInputFileOptions} [options]
 */
const TEST_INPUT_MOVIE_FILE_PATH = (index = 1, options) =>
  join(TEST_INPUT_DIR, TEST_INPUT_MOVIE_FILE_NAME(index, options))

const TEST_OUTPUT_MOVIE_DIR_NAME = (index = 1) =>
  `${TEST_MOVIE_TITLE(index)} (${TEST_YEAR})`

const TEST_OUTPUT_MOVIE_DIR_PATH = (index = 1) =>
  join(TEST_MOVIES_DIR, TEST_OUTPUT_MOVIE_DIR_NAME(index))

/**
 * @typedef TestOutputFileOptions
 * @property {string} [extension]
 */

/**
 * @param {number} index
 * @param {TestOutputFileOptions} [options]
 */
const TEST_OUTPUT_MOVIE_FILE_NAME = (index = 1, options) => {
  const {extension} = {extension: '.mkv', ...options}
  return `${TEST_OUTPUT_MOVIE_DIR_NAME(index)}${extension}`
}

/**
 * @param {number} index
 * @param {TestOutputFileOptions} [options]
 */
const TEST_OUTPUT_MOVIE_FILE_PATH = (index = 1, options) =>
  join(
    TEST_OUTPUT_MOVIE_DIR_PATH(index),
    TEST_OUTPUT_MOVIE_FILE_NAME(index, options),
  )

/**
 * @typedef TestShowFileOptions
 * @property {number} [season]
 * @property {number} [episode]
 * @property {number} [secondEpisode]
 */

/**
 * @param {number} index
 * @param {TestShowFileOptions & TestInputFileOptions} [options]
 */
const TEST_INPUT_SHOW_FILE_NAME = (index = 1, options) => {
  let {season, episode, secondEpisode, hasValidPattern, extension} = {
    season: 1,
    episode: 1,
    extension: '.mkv',
    hasValidPattern: true,
    ...options,
  }
  season = pad(season)
  episode = pad(episode)
  secondEpisode = secondEpisode != null ? `-E${pad(secondEpisode)}` : ''
  return `Test.Show.${index}${
    hasValidPattern ? `.${TEST_YEAR}.S${season}E${episode}${secondEpisode}` : ''
  }${extension}`
}

/**
 * @param {number} index
 * @param {TestShowFileOptions & TestInputFileOptions} [options]
 */
const TEST_INPUT_SHOW_FILE_PATH = (index = 1, options) =>
  join(TEST_INPUT_DIR, TEST_INPUT_SHOW_FILE_NAME(index, options))

const TEST_OUTPUT_SHOW_DIR_NAME = (index = 1) =>
  `${TEST_SHOW_TITLE(index)} (${TEST_YEAR})`

const TEST_OUTPUT_SHOW_DIR_PATH = (index = 1) =>
  join(TEST_SHOWS_DIR, TEST_OUTPUT_SHOW_DIR_NAME(index))

/**
 * @param {number} index
 * @param {TestShowFileOptions} [options]
 */
const TEST_OUTPUT_SHOW_SEASON_DIR_NAME = (
  index = 1, // eslint-disable-line no-unused-vars
  options,
) => {
  const {season} = {season: 1, ...options}
  return `Season ${pad(season)}`
}

/**
 * @param {number} index
 * @param {TestShowFileOptions} [options]
 */
const TEST_OUTPUT_SHOW_SEASON_DIR_PATH = (index = 1, options) =>
  join(
    TEST_OUTPUT_SHOW_DIR_PATH(index),
    TEST_OUTPUT_SHOW_SEASON_DIR_NAME(index, options),
  )

/**
 * @param {number} index
 * @param {TestShowFileOptions & TestOutputFileOptions} [options]
 */
const TEST_OUTPUT_SHOW_FILE_NAME = (index = 1, options) => {
  let {season, episode, secondEpisode, extension} = {
    season: 1,
    episode: 1,
    extension: '.mkv',
    ...options,
  }
  const showTitle = TEST_OUTPUT_SHOW_DIR_NAME(index)
  const episodeTitle = TEST_EPISODE_TITLE(episode)
  const secondEpisodeTitle =
    secondEpisode != null ? ` & ${TEST_EPISODE_TITLE(secondEpisode)}` : ''
  season = pad(season)
  episode = pad(episode)
  secondEpisode = secondEpisode != null ? `-E${pad(secondEpisode)}` : ''
  return `${showTitle} - S${season}E${episode}${secondEpisode} - ${episodeTitle}${secondEpisodeTitle}${extension}`
}

/**
 * @param {number} index
 * @param {TestShowFileOptions & TestOutputFileOptions} [options]
 */
const TEST_OUTPUT_SHOW_FILE_PATH = (index = 1, options) =>
  join(
    TEST_OUTPUT_SHOW_SEASON_DIR_PATH(index, options),
    TEST_OUTPUT_SHOW_FILE_NAME(index, options),
  )

/**
 * @param {string} oldFileName
 * @param {string} newFilePath
 */
const TEST_RENAME_QUESTION = (oldFileName, newFilePath) =>
  TEST_CONFIRM_QUESTION(`Rename ${oldFileName} to ${newFilePath}?`)

/**
 * @typedef TestRenameQuestionOptions
 * @property {number} [outputIndex]
 * @property {number} [outputExtension]
 */

/**
 * @typedef TestRenameAnswerOptions
 * @property {boolean} answer
 */

/**
 * @param {number} index
 * @param {TestRenameQuestionOptions & TestInputFileOptions} [options]
 */
const TEST_MOVIE_RENAME_QUESTION = (index = 1, options) => {
  const {extension} = {extension: '.mkv', ...options}
  const {outputIndex, ...fileOptions} = {outputIndex: index, ...options}
  const {outputExtension, ...inputFileOptions} = {
    outputExtension: extension,
    ...fileOptions,
  }
  return TEST_RENAME_QUESTION(
    TEST_INPUT_MOVIE_FILE_NAME(index, inputFileOptions),
    TEST_OUTPUT_MOVIE_FILE_PATH(outputIndex, {extension: outputExtension}),
  )
}

/**
 * @param {number} index
 * @param {TestRenameAnswerOptions & TestRenameQuestionOptions & TestInputFileOptions} [options]
 */
const TEST_MOVIE_RENAME_ANSWER = (index = 1, options) => {
  const {answer, ...questionOptions} = {answer: true, ...options}
  return {
    question: TEST_MOVIE_RENAME_QUESTION(index, questionOptions),
    answer,
  }
}

/**
 * @typedef TestShowRenameQuestionOptions
 * @property {number} [outputSeason]
 * @property {number} [outputEpisode]
 * @property {number} [outputSecondEpisode]
 */

/**
 * @param {number} index
 * @param {TestShowRenameQuestionOptions & TestRenameQuestionOptions & TestShowFileOptions & TestInputFileOptions} [options]
 */
const TEST_SHOW_RENAME_QUESTION = (index = 1, options) => {
  const {extension, season, episode, secondEpisode} = {
    extension: '.mkv',
    season: 1,
    episode: 1,
    ...options,
  }
  const {
    outputIndex,
    outputSeason,
    outputEpisode,
    outputSecondEpisode,
    ...fileOptions
  } = {
    outputIndex: index,
    outputSeason: season,
    outputEpisode: episode,
    outputSecondEpisode: secondEpisode,
    ...options,
  }
  const {outputExtension, ...inputFileOptions} = {
    outputExtension: extension,
    ...fileOptions,
  }
  return TEST_RENAME_QUESTION(
    TEST_INPUT_SHOW_FILE_NAME(index, inputFileOptions),
    TEST_OUTPUT_SHOW_FILE_PATH(outputIndex, {
      extension: outputExtension,
      season: outputSeason,
      episode: outputEpisode,
      secondEpisode: outputSecondEpisode,
    }),
  )
}

/**
 * @param {number} index
 * @param {TestRenameAnswerOptions & TestShowRenameQuestionOptions & TestRenameQuestionOptions & TestShowFileOptions & TestInputFileOptions} [options]
 */
const TEST_SHOW_RENAME_ANSWER = (index = 1, options) => {
  const {answer, ...questionOptions} = {answer: true, ...options}
  return {
    question: TEST_SHOW_RENAME_QUESTION(index, questionOptions),
    answer,
  }
}

/**
 * @param {number} index
 * @param {TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_SEASON_QUESTION = (index = 1, options) =>
  TEST_LIST_QUESTION(
    `Unable to determine season for ${TEST_INPUT_SHOW_FILE_NAME(
      index,
      options,
    )}. Please choose one.`,
  )

/**
 * @typedef TestSeasonAnswerOptions
 * @property {number | null} answer
 */

/**
 * @param {number} index
 * @param {TestSeasonAnswerOptions & TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_SEASON_ANSWER = (index = 1, options) => {
  const {season} = {season: 1, ...options}
  const {answer, ...questionOptions} = {answer: season, ...options}
  return {
    question: TEST_SEASON_QUESTION(index, questionOptions),
    answer,
  }
}

/**
 * @param {number} index
 * @param {TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_EPISODE_QUESTION = (index = 1, options) =>
  TEST_LIST_QUESTION(
    `Unable to determine episode for ${TEST_INPUT_SHOW_FILE_NAME(
      index,
      options,
    )}. Please choose one.`,
  )

/**
 * @typedef TestEpisodeAnswerOptions
 * @property {number | null} answer
 */

/**
 * @param {number} index
 * @param {TestEpisodeAnswerOptions & TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_EPISODE_ANSWER = (index = 1, options) => {
  const {episode} = {episode: 1, ...options}
  const {answer, ...questionOptions} = {answer: episode, ...options}
  return {
    question: TEST_EPISODE_QUESTION(index, questionOptions),
    answer,
  }
}

/**
 * @param {number} index
 * @param {TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_FIRST_EPISODE_QUESTION = (index = 1, options) =>
  TEST_LIST_QUESTION(
    `Unable to determine first episode for ${TEST_INPUT_SHOW_FILE_NAME(
      index,
      options,
    )}. Please choose one.`,
  )

/**
 * @param {number} index
 * @param {TestEpisodeAnswerOptions & TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_FIRST_EPISODE_ANSWER = (index = 1, options) => {
  const {episode} = {episode: 1, ...options}
  const {answer, ...questionOptions} = {answer: episode, ...options}
  return {
    question: TEST_FIRST_EPISODE_QUESTION(index, questionOptions),
    answer,
  }
}

/**
/**
 * @param {number} index
 * @param {TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_SECOND_EPISODE_QUESTION = (index = 1, options) =>
  TEST_LIST_QUESTION(
    `Unable to determine second episode for ${TEST_INPUT_SHOW_FILE_NAME(
      index,
      options,
    )}. Please choose one.`,
  )

/**
 * @param {number} index
 * @param {TestEpisodeAnswerOptions & TestShowFileOptions & TestInputFileOptions} options
 */
const TEST_SECOND_EPISODE_ANSWER = (index = 1, options) => {
  const {episode} = {episode: 1, ...options}
  const {answer, ...questionOptions} = {answer: episode, ...options}
  return {
    question: TEST_SECOND_EPISODE_QUESTION(index, questionOptions),
    answer,
  }
}

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
 * @param {string} title
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
const TEST_SKIPPING_QUESTION = filename =>
  TEST_LIST_QUESTION(`Skipping ${filename}.`)

/**
 * @param {string} filename
 */
const TEST_SKIPPING_ANSWER = filename => ({
  question: TEST_SKIPPING_QUESTION(filename),
  answer: 'OK',
})

module.exports = {
  clone,
  immediate,
  TEST_TMDB_ACCESS_TOKEN,
  TEST_TMDB_ACCESS_TOKEN_ANSWER,
  TEST_TMDB_MOVIE,
  TEST_TMDB_SHOW,
  TEST_INPUT_DIR,
  TEST_INPUT_DIR_ANSWER,
  TEST_MOVIES_DIR,
  TEST_MOVIES_DIR_ANSWER,
  TEST_SHOWS_DIR,
  TEST_SHOWS_DIR_ANSWER,
  TEST_RENAME_MK3D_FILES_ANSWER,
  TEST_MOVIE_TITLE,
  TEST_SHOW_TITLE,
  TEST_INPUT_MOVIE_FILE_NAME,
  TEST_INPUT_MOVIE_FILE_PATH,
  TEST_INPUT_SHOW_FILE_NAME,
  TEST_INPUT_SHOW_FILE_PATH,
  TEST_OUTPUT_MOVIE_DIR_PATH,
  TEST_OUTPUT_MOVIE_FILE_PATH,
  TEST_OUTPUT_SHOW_DIR_PATH,
  TEST_OUTPUT_SHOW_SEASON_DIR_PATH,
  TEST_OUTPUT_SHOW_FILE_PATH,
  TEST_MODE_ANSWER,
  TEST_FILES_ANSWER,
  TEST_SEASON_ANSWER,
  TEST_EPISODE_ANSWER,
  TEST_FIRST_EPISODE_ANSWER,
  TEST_SECOND_EPISODE_ANSWER,
  TEST_MULTIPLE_RESULTS_ANSWER,
  TEST_INVALID_PATTERN_ANSWER,
  TEST_NO_RESULTS_ANSWER,
  TEST_MOVIE_RENAME_ANSWER,
  TEST_SHOW_RENAME_ANSWER,
  TEST_SKIPPING_ANSWER,
}
