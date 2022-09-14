const t = require('tap')
const {createMockConfPackage} = require('./mock-conf-package')
const {createMockCrossFetchPackage} = require('./mock-cross-fetch-package')
const {createMockFSPackage} = require('./mock-fs-package')
const {createMockInquirerPackage} = require('./mock-inquirer-package')
const {
  clone,
  TEST_TMDB_ACCESS_TOKEN,
  TEST_TMDB_MOVIE,
  TEST_TMDB_SHOW,
  TEST_INPUT_DIR,
  TEST_MOVIES_DIR,
  TEST_SHOWS_DIR,
  TEST_INPUT_MOVIE_FILE_NAME,
  TEST_INPUT_MOVIE_FILE_PATH,
  TEST_INPUT_SHOW_FILE_PATH,
  TEST_INPUT_QUESTION,
  TEST_CONFIRM_QUESTION,
  TEST_MODE_ANSWER,
  TEST_FILES_ANSWER,
  TEST_MOVIE_RENAME_ANSWER,
  TEST_SHOW_RENAME_ANSWER,
  TEST_OUTPUT_MOVIE_DIR_PATH,
  TEST_OUTPUT_MOVIE_FILE_PATH,
  TEST_INPUT_SHOW_FILE_NAME,
  TEST_OUTPUT_SHOW_DIR_PATH,
  TEST_OUTPUT_SHOW_SEASON_DIR_PATH,
  TEST_OUTPUT_SHOW_FILE_PATH,
} = require('./util')

/** @type {import('./mock-conf-package').MockConfPackageState} */
const DEFAULT_MOCK_CONF_PACKAGE_STATE = {
  values: {
    tmdbAccessToken: TEST_TMDB_ACCESS_TOKEN(),
    inputDir: TEST_INPUT_DIR(),
    moviesDir: TEST_MOVIES_DIR(),
    showsDir: TEST_SHOWS_DIR(),
    renameMK3DToMKV: true,
  },
}

/** @type {import('./mock-cross-fetch-package').MockCrossFetchPackageState} */
const DEFAULT_MOCK_CROSS_FETCH_PACKAGE_STATE = {
  movies: [TEST_TMDB_MOVIE(1), TEST_TMDB_MOVIE(2), TEST_TMDB_MOVIE(3)],
  shows: [TEST_TMDB_SHOW(1), TEST_TMDB_SHOW(2), TEST_TMDB_SHOW(3)],
}

/**
 * @typedef MockAppModuleOptions
 * @property {import('./mock-fs-package').MockFSPackageState} [fsPackageState]
 * @property {import('./mock-conf-package').MockConfPackageState} [confPackageState]
 * @property {import('./mock-cross-fetch-package').MockCrossFetchPackageState} [crossFetchPackageState]
 * @property {import('./mock-inquirer-package').MockInquirerPackageState} [inquirerPackageState]
 */

/**
 * @param {MockAppModuleOptions} [options]
 */
function requireMockMainModule({
  fsPackageState,
  confPackageState,
  crossFetchPackageState,
  inquirerPackageState,
} = {}) {
  const mockFSPackage = createMockFSPackage(fsPackageState || {})
  const mockConfPackage = createMockConfPackage(
    confPackageState || clone(DEFAULT_MOCK_CONF_PACKAGE_STATE),
  )
  const mockCrossFetchPackage = createMockCrossFetchPackage(
    crossFetchPackageState || DEFAULT_MOCK_CROSS_FETCH_PACKAGE_STATE,
  )
  const mockInquirerPackage = createMockInquirerPackage(inquirerPackageState)

  /** @type {typeof import('../lib/main')} */
  const mockAppModule = t.mock('../lib/main', {
    fs: mockFSPackage,
    inquirer: mockInquirerPackage,
    'cross-fetch': mockCrossFetchPackage,
    conf: mockConfPackage,
  })

  return mockAppModule
}

t.test('conf', async t => {
  const mockFSPackageState = {
    entries: {
      [TEST_INPUT_DIR()]: 'directory',
    },
  }

  const mockConfPackageState = {values: {}}

  const {main} = requireMockMainModule({
    fsPackageState: mockFSPackageState,
    confPackageState: mockConfPackageState,
    inquirerPackageState: {
      answers: [
        {
          question: TEST_INPUT_QUESTION(
            'Please visit https://www.themoviedb.org/settings/api to acquire an API Read Access Token (v4 auth) and enter it here:',
          ),
          answer: TEST_TMDB_ACCESS_TOKEN(),
        },
        {
          question: TEST_INPUT_QUESTION(
            'In what folder are the files you want to rename?',
          ),
          answer: TEST_INPUT_DIR(),
        },
        {
          question: TEST_INPUT_QUESTION(
            'In what folder does your movie library reside?',
          ),
          answer: TEST_MOVIES_DIR(),
        },
        {
          question: TEST_INPUT_QUESTION(
            'In what folder does your TV show library reside?',
          ),
          answer: TEST_SHOWS_DIR(),
        },
        {
          question: TEST_CONFIRM_QUESTION(
            'Do you want to rename *.mk3d files to *.mkv? (Plex does not support the *.mk3d file extension.)',
          ),
          answer: true,
        },
        TEST_MODE_ANSWER('movies'),
        TEST_FILES_ANSWER([]),
      ],
    },
  })

  await main()

  t.strictSame(
    mockConfPackageState.values,
    {
      tmdbAccessToken: TEST_TMDB_ACCESS_TOKEN(),
      inputDir: TEST_INPUT_DIR(),
      moviesDir: TEST_MOVIES_DIR(),
      showsDir: TEST_SHOWS_DIR(),
      renameMK3DToMKV: true,
    },
    'conf matches',
  )
})

t.test('movies', async t => {
  t.test('all', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_INPUT_MOVIE_FILE_PATH(1)]: 'file',
        [TEST_INPUT_MOVIE_FILE_PATH(2)]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([
            TEST_INPUT_MOVIE_FILE_NAME(1),
            TEST_INPUT_MOVIE_FILE_NAME(2),
          ]),
          TEST_MOVIE_RENAME_ANSWER(1),
          TEST_MOVIE_RENAME_ANSWER(2),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_MOVIES_DIR()]: 'directory',
        [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(1)]: 'file',
        [TEST_OUTPUT_MOVIE_DIR_PATH(2)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(2)]: 'file',
      },
      'files renamed',
    )
  })

  t.test('one', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_INPUT_MOVIE_FILE_PATH(1)]: 'file',
        [TEST_INPUT_MOVIE_FILE_PATH(2)]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([TEST_INPUT_MOVIE_FILE_NAME(1)]),
          TEST_MOVIE_RENAME_ANSWER(1),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_MOVIES_DIR()]: 'directory',
        [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(1)]: 'file',
        [TEST_INPUT_MOVIE_FILE_PATH(2)]: 'file',
      },
      'files renamed',
    )
  })
})

t.test('shows', async t => {
  t.test('all', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 1, episode: 1})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 1, episode: 2})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 2, episode: 1})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 2, episode: 2})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(2, {season: 1, episode: 1})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(2, {season: 1, episode: 2})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(2, {season: 2, episode: 1})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(2, {season: 2, episode: 2})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(3, {
          season: 1,
          episode: 1,
          secondEpisode: 2,
        })]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('tv'),
          TEST_FILES_ANSWER([
            TEST_INPUT_SHOW_FILE_NAME(1, {season: 1, episode: 1}),
            TEST_INPUT_SHOW_FILE_NAME(1, {season: 1, episode: 2}),
            TEST_INPUT_SHOW_FILE_NAME(1, {season: 2, episode: 1}),
            TEST_INPUT_SHOW_FILE_NAME(1, {season: 2, episode: 2}),
            TEST_INPUT_SHOW_FILE_NAME(2, {season: 1, episode: 1}),
            TEST_INPUT_SHOW_FILE_NAME(2, {season: 1, episode: 2}),
            TEST_INPUT_SHOW_FILE_NAME(2, {season: 2, episode: 1}),
            TEST_INPUT_SHOW_FILE_NAME(2, {season: 2, episode: 2}),
            TEST_INPUT_SHOW_FILE_NAME(3, {
              season: 1,
              episode: 1,
              secondEpisode: 2,
            }),
          ]),
          TEST_SHOW_RENAME_ANSWER(1, {season: 1, episode: 1}),
          TEST_SHOW_RENAME_ANSWER(1, {season: 1, episode: 2}),
          TEST_SHOW_RENAME_ANSWER(1, {season: 2, episode: 1}),
          TEST_SHOW_RENAME_ANSWER(1, {season: 2, episode: 2}),
          TEST_SHOW_RENAME_ANSWER(2, {season: 1, episode: 1}),
          TEST_SHOW_RENAME_ANSWER(2, {season: 1, episode: 2}),
          TEST_SHOW_RENAME_ANSWER(2, {season: 2, episode: 1}),
          TEST_SHOW_RENAME_ANSWER(2, {season: 2, episode: 2}),
          TEST_SHOW_RENAME_ANSWER(3, {
            season: 1,
            episode: 1,
            secondEpisode: 2,
          }),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_SHOWS_DIR()]: 'directory',
        [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1, {season: 1})]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(1, {season: 1, episode: 1})]: 'file',
        [TEST_OUTPUT_SHOW_FILE_PATH(1, {season: 1, episode: 2})]: 'file',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1, {season: 2})]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(1, {season: 2, episode: 1})]: 'file',
        [TEST_OUTPUT_SHOW_FILE_PATH(1, {season: 2, episode: 2})]: 'file',
        [TEST_OUTPUT_SHOW_DIR_PATH(2)]: 'directory',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(2, {season: 1})]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(2, {season: 1, episode: 1})]: 'file',
        [TEST_OUTPUT_SHOW_FILE_PATH(2, {season: 1, episode: 2})]: 'file',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(2, {season: 2})]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(2, {season: 2, episode: 1})]: 'file',
        [TEST_OUTPUT_SHOW_FILE_PATH(2, {season: 2, episode: 2})]: 'file',
        [TEST_OUTPUT_SHOW_DIR_PATH(3)]: 'directory',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(3, {season: 1})]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(3, {
          season: 1,
          episode: 1,
          secondEpisode: 2,
        })]: 'file',
      },
      'files renamed',
    )
  })

  t.test('one', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 1, episode: 1})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 1, episode: 2})]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('tv'),
          TEST_FILES_ANSWER([
            TEST_INPUT_SHOW_FILE_NAME(1, {season: 1, episode: 1}),
          ]),
          TEST_SHOW_RENAME_ANSWER(1, {season: 1, episode: 1}),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR()]: 'directory',
        [TEST_SHOWS_DIR()]: 'directory',
        [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1, {season: 1})]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(1, {season: 1, episode: 1})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 1, episode: 2})]: 'file',
      },
      'files renamed',
    )
  })
})
