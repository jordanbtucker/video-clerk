const t = require('tap')
const {restore, stub} = require('sinon')
const {createMockConfPackage} = require('./mock-conf-package')
const {createMockCrossFetchPackage} = require('./mock-cross-fetch-package')
const {createMockFSPackage} = require('./mock-fs-package')
const {createMockInquirerPackage} = require('./mock-inquirer-package')
const {
  TEST_PROFILE_NAME,
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
} = require('./util')

const DEFAULT_PROFILE_NAME = 'default'

/** @type {import('./mock-conf-package').MockConfPackageState} */
const DEFAULT_MOCK_CONF_PACKAGE_STATE = (profile = DEFAULT_PROFILE_NAME) => ({
  values: {
    version: 2,
    [`profiles.${profile}.tmdbAccessToken`]: TEST_TMDB_ACCESS_TOKEN,
    [`profiles.${profile}.inputDir`]: TEST_INPUT_DIR,
    [`profiles.${profile}.moviesDir`]: TEST_MOVIES_DIR,
    [`profiles.${profile}.showsDir`]: TEST_SHOWS_DIR,
    [`profiles.${profile}.renameMK3DToMKV`]: true,
  },
})

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
    confPackageState || DEFAULT_MOCK_CONF_PACKAGE_STATE(),
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
  t.test('provide answers', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {values: {}}

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [
          TEST_TMDB_ACCESS_TOKEN_ANSWER(),
          TEST_INPUT_DIR_ANSWER(),
          TEST_MOVIES_DIR_ANSWER(),
          TEST_SHOWS_DIR_ANSWER(),
          TEST_RENAME_MK3D_FILES_ANSWER(),
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([]),
        ],
      },
    })

    await main()

    t.strictSame(
      mockConfPackageState.values,
      {
        version: 2,
        [`profiles.${DEFAULT_PROFILE_NAME}.tmdbAccessToken`]:
          TEST_TMDB_ACCESS_TOKEN,
        [`profiles.${DEFAULT_PROFILE_NAME}.inputDir`]: TEST_INPUT_DIR,
        [`profiles.${DEFAULT_PROFILE_NAME}.moviesDir`]: TEST_MOVIES_DIR,
        [`profiles.${DEFAULT_PROFILE_NAME}.showsDir`]: TEST_SHOWS_DIR,
        [`profiles.${DEFAULT_PROFILE_NAME}.renameMK3DToMKV`]: true,
      },
      'conf matches',
    )
  })

  t.test('conf exists', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = DEFAULT_MOCK_CONF_PACKAGE_STATE()

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [TEST_MODE_ANSWER('movies'), TEST_FILES_ANSWER([])],
      },
    })

    await main()

    t.strictSame(
      mockConfPackageState.values,
      {
        version: 2,
        [`profiles.${DEFAULT_PROFILE_NAME}.tmdbAccessToken`]:
          TEST_TMDB_ACCESS_TOKEN,
        [`profiles.${DEFAULT_PROFILE_NAME}.inputDir`]: TEST_INPUT_DIR,
        [`profiles.${DEFAULT_PROFILE_NAME}.moviesDir`]: TEST_MOVIES_DIR,
        [`profiles.${DEFAULT_PROFILE_NAME}.showsDir`]: TEST_SHOWS_DIR,
        [`profiles.${DEFAULT_PROFILE_NAME}.renameMK3DToMKV`]: true,
      },
      'conf matches',
    )
  })

  t.test('cancel tmdbAccessToken', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {values: {}}

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [
          TEST_TMDB_ACCESS_TOKEN_ANSWER(null),
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([]),
        ],
      },
    })

    await main()

    t.equal(process.exitCode, 1, 'exits with code 1')

    process.exitCode = 0
  })

  t.test('cancel inputDir', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {values: {}}

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [
          TEST_TMDB_ACCESS_TOKEN_ANSWER(),
          TEST_INPUT_DIR_ANSWER(null),
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([]),
        ],
      },
    })

    await main()

    t.equal(process.exitCode, 1, 'exits with code 1')

    process.exitCode = 0
  })

  t.test('cancel moviesDir', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {values: {}}

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [
          TEST_TMDB_ACCESS_TOKEN_ANSWER(),
          TEST_INPUT_DIR_ANSWER(),
          TEST_MOVIES_DIR_ANSWER(null),
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([]),
        ],
      },
    })

    await main()

    t.equal(process.exitCode, 1, 'exits with code 1')

    process.exitCode = 0
  })

  t.test('cancel showsDir', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {values: {}}

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [
          TEST_TMDB_ACCESS_TOKEN_ANSWER(),
          TEST_INPUT_DIR_ANSWER(),
          TEST_MOVIES_DIR_ANSWER(),
          TEST_SHOWS_DIR_ANSWER(null),
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([]),
        ],
      },
    })

    await main()

    t.equal(process.exitCode, 1, 'exits with code 1')

    process.exitCode = 0
  })

  t.test('cancel renameMK3DToMKV', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {values: {}}

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [
          TEST_TMDB_ACCESS_TOKEN_ANSWER(),
          TEST_INPUT_DIR_ANSWER(),
          TEST_MOVIES_DIR_ANSWER(),
          TEST_SHOWS_DIR_ANSWER(),
          TEST_RENAME_MK3D_FILES_ANSWER(null),
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([]),
        ],
      },
    })

    await main()

    t.equal(process.exitCode, 1, 'exits with code 1')

    process.exitCode = 0
  })

  t.test('migrates', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {
      values: {
        tmdbAccessToken: TEST_TMDB_ACCESS_TOKEN,
        inputDir: TEST_INPUT_DIR,
        moviesDir: TEST_MOVIES_DIR,
        showsDir: TEST_SHOWS_DIR,
        renameMK3DToMKV: true,
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [TEST_MODE_ANSWER('movies'), TEST_FILES_ANSWER([])],
      },
    })

    await main()

    t.strictSame(
      mockConfPackageState.values,
      DEFAULT_MOCK_CONF_PACKAGE_STATE().values,
      'conf matches',
    )
  })
})

t.test('args', async t => {
  t.test('skips conf prompts', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState = {values: {}}

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [TEST_MODE_ANSWER('movies'), TEST_FILES_ANSWER([])],
      },
    })

    const argv = process.argv
    process.argv = [
      argv[0],
      argv[1],
      '--token',
      TEST_TMDB_ACCESS_TOKEN,
      '--input',
      TEST_INPUT_DIR,
      '--movies',
      TEST_MOVIES_DIR,
      '--shows',
      TEST_SHOWS_DIR,
      '--no-mk3d-to-mkv',
    ]

    await main()

    t.strictSame(mockConfPackageState.values, {version: 2}, 'conf matches')

    process.argv = argv
  })

  t.test('displays help', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [TEST_MODE_ANSWER('movies'), TEST_FILES_ANSWER([])],
      },
    })

    const argv = process.argv
    process.argv = [argv[0], argv[1], '--help']

    const exitStub = stub(process, 'exit')
    const logStub = stub(console, 'log')

    await main()

    t.ok(logStub.calledWithMatch(/Usage:/), 'displays help')
    t.ok(exitStub.calledOnce, 'exits')

    restore()

    process.argv = argv
  })

  t.test('uses profile', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const mockConfPackageState =
      DEFAULT_MOCK_CONF_PACKAGE_STATE(TEST_PROFILE_NAME)

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [TEST_MODE_ANSWER('movies'), TEST_FILES_ANSWER([])],
      },
    })

    const argv = process.argv
    process.argv = [argv[0], argv[1], '--profile', TEST_PROFILE_NAME]

    await main()

    t.strictSame(
      mockConfPackageState.values,
      {
        version: 2,
        [`profiles.${TEST_PROFILE_NAME}.tmdbAccessToken`]:
          TEST_TMDB_ACCESS_TOKEN,
        [`profiles.${TEST_PROFILE_NAME}.inputDir`]: TEST_INPUT_DIR,
        [`profiles.${TEST_PROFILE_NAME}.moviesDir`]: TEST_MOVIES_DIR,
        [`profiles.${TEST_PROFILE_NAME}.showsDir`]: TEST_SHOWS_DIR,
        [`profiles.${TEST_PROFILE_NAME}.renameMK3DToMKV`]: true,
      },
      'conf matches',
    )

    process.argv = argv
  })

  t.test('throws on unknown options', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [TEST_MODE_ANSWER('movies'), TEST_FILES_ANSWER([])],
      },
    })

    const argv = process.argv
    process.argv = [argv[0], argv[1], '--unknown']

    await t.rejects(main(), /Unknown option/, 'throws')

    process.argv = argv
  })
})

t.test('movies', async t => {
  t.test('all', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
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
        [TEST_INPUT_DIR]: 'directory',
        [TEST_MOVIES_DIR]: 'directory',
        [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(1)]: 'file',
        [TEST_OUTPUT_MOVIE_DIR_PATH(2)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(2)]: 'file',
      },
      'files renamed',
    )
  })

  t.test('cancel rename', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_MOVIE_FILE_PATH(1)]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([TEST_INPUT_MOVIE_FILE_NAME(1)]),
          TEST_MOVIE_RENAME_ANSWER(1, {answer: false}),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_MOVIE_FILE_PATH(1)]: 'file',
      },
      'file renamed',
    )
  })

  t.test('one', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
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
        [TEST_INPUT_DIR]: 'directory',
        [TEST_MOVIES_DIR]: 'directory',
        [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(1)]: 'file',
        [TEST_INPUT_MOVIE_FILE_PATH(2)]: 'file',
      },
      'file renamed',
    )
  })

  t.test('no match', async t => {
    t.test('provide title', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(4)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('movies'),
            TEST_FILES_ANSWER([TEST_INPUT_MOVIE_FILE_NAME(4)]),
            TEST_NO_RESULTS_ANSWER(TEST_MOVIE_TITLE(4), TEST_MOVIE_TITLE(1)),
            TEST_MOVIE_RENAME_ANSWER(4, {outputIndex: 1}),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_MOVIES_DIR]: 'directory',
          [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_MOVIE_FILE_PATH(1)]: 'file',
        },
        'file renamed',
      )
    })

    t.test('skip file', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(4)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('movies'),
            TEST_FILES_ANSWER([TEST_INPUT_MOVIE_FILE_NAME(4)]),
            TEST_NO_RESULTS_ANSWER(TEST_MOVIE_TITLE(4), null),
            TEST_SKIPPING_ANSWER(TEST_INPUT_MOVIE_FILE_NAME(4)),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(4)]: 'file',
        },
        'file skipped',
      )
    })
  })

  t.test('invalid pattern', async t => {
    t.test('provide title', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(1, {hasValidPattern: false})]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('movies'),
            TEST_FILES_ANSWER([
              TEST_INPUT_MOVIE_FILE_NAME(1, {hasValidPattern: false}),
            ]),
            TEST_INVALID_PATTERN_ANSWER(
              TEST_INPUT_MOVIE_FILE_NAME(1, {hasValidPattern: false}),
              TEST_MOVIE_TITLE(1),
            ),
            TEST_MOVIE_RENAME_ANSWER(1, {hasValidPattern: false}),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_MOVIES_DIR]: 'directory',
          [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_MOVIE_FILE_PATH(1)]: 'file',
        },
        'file renamed',
      )
    })

    t.test('skip file', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(1, {hasValidPattern: false})]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('movies'),
            TEST_FILES_ANSWER([
              TEST_INPUT_MOVIE_FILE_NAME(1, {hasValidPattern: false}),
            ]),
            TEST_INVALID_PATTERN_ANSWER(
              TEST_INPUT_MOVIE_FILE_NAME(1, {hasValidPattern: false}),
              null,
            ),
            TEST_SKIPPING_ANSWER(
              TEST_INPUT_MOVIE_FILE_NAME(1, {hasValidPattern: false}),
            ),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(1, {hasValidPattern: false})]: 'file',
        },
        'file skipped',
      )
    })
  })

  t.test('multiple results', async t => {
    t.test('select result', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(1)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        crossFetchPackageState: {
          ...DEFAULT_MOCK_CROSS_FETCH_PACKAGE_STATE,
          returnMultipleResults: true,
        },
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('movies'),
            TEST_FILES_ANSWER([TEST_INPUT_MOVIE_FILE_NAME(1)]),
            TEST_MULTIPLE_RESULTS_ANSWER(TEST_INPUT_MOVIE_FILE_NAME(1), 1),
            TEST_MOVIE_RENAME_ANSWER(1),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_MOVIES_DIR]: 'directory',
          [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_MOVIE_FILE_PATH(1)]: 'file',
        },
        'file renamed',
      )
    })

    t.test('skip results', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(1)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        crossFetchPackageState: {
          ...DEFAULT_MOCK_CROSS_FETCH_PACKAGE_STATE,
          returnMultipleResults: true,
        },
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('movies'),
            TEST_FILES_ANSWER([TEST_INPUT_MOVIE_FILE_NAME(1)]),
            TEST_MULTIPLE_RESULTS_ANSWER(TEST_INPUT_MOVIE_FILE_NAME(1), null),
            TEST_SKIPPING_ANSWER(TEST_INPUT_MOVIE_FILE_NAME(1)),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_MOVIE_FILE_PATH(1)]: 'file',
        },
        'file skipped',
      )
    })
  })
})

t.test('shows', async t => {
  t.test('all', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
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
        [TEST_INPUT_DIR]: 'directory',
        [TEST_SHOWS_DIR]: 'directory',
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
        [TEST_INPUT_DIR]: 'directory',
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
        [TEST_INPUT_DIR]: 'directory',
        [TEST_SHOWS_DIR]: 'directory',
        [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1, {season: 1})]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(1, {season: 1, episode: 1})]: 'file',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 1, episode: 2})]: 'file',
      },
      'file renamed',
    )
  })

  t.test('cancel rename', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_SHOW_FILE_PATH(1)]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('tv'),
          TEST_FILES_ANSWER([TEST_INPUT_SHOW_FILE_NAME(1)]),
          TEST_SHOW_RENAME_ANSWER(1, {answer: false}),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_SHOW_FILE_PATH(1)]: 'file',
      },
      'file renamed',
    )
  })

  t.test('no match', async t => {
    t.test('provide title', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(4)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([TEST_INPUT_SHOW_FILE_NAME(4)]),
            TEST_NO_RESULTS_ANSWER(TEST_SHOW_TITLE(4), TEST_SHOW_TITLE(1)),
            TEST_SHOW_RENAME_ANSWER(4, {outputIndex: 1}),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_SHOWS_DIR]: 'directory',
          [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_FILE_PATH(1)]: 'file',
        },
        'file renamed',
      )
    })

    t.test('skip file', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(4)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([TEST_INPUT_SHOW_FILE_NAME(4)]),
            TEST_NO_RESULTS_ANSWER(TEST_SHOW_TITLE(4), null),
            TEST_SKIPPING_ANSWER(TEST_INPUT_SHOW_FILE_NAME(4)),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(4)]: 'file',
        },
        'file skipped',
      )
    })
  })

  t.test('invalid pattern', async t => {
    t.test('provide title', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1, {hasValidPattern: false})]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([
              TEST_INPUT_SHOW_FILE_NAME(1, {hasValidPattern: false}),
            ]),
            TEST_INVALID_PATTERN_ANSWER(
              TEST_INPUT_SHOW_FILE_NAME(1, {hasValidPattern: false}),
              TEST_SHOW_TITLE(1),
            ),
            TEST_SEASON_ANSWER(1, {hasValidPattern: false}),
            TEST_EPISODE_ANSWER(1, {hasValidPattern: false}),
            TEST_SHOW_RENAME_ANSWER(1, {hasValidPattern: false}),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_SHOWS_DIR]: 'directory',
          [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_FILE_PATH(1)]: 'file',
        },
        'file renamed',
      )
    })

    t.test('skip file', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1, {hasValidPattern: false})]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([
              TEST_INPUT_SHOW_FILE_NAME(1, {hasValidPattern: false}),
            ]),
            TEST_INVALID_PATTERN_ANSWER(
              TEST_INPUT_SHOW_FILE_NAME(1, {hasValidPattern: false}),
              null,
            ),
            TEST_SKIPPING_ANSWER(
              TEST_INPUT_SHOW_FILE_NAME(1, {hasValidPattern: false}),
            ),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1, {hasValidPattern: false})]: 'file',
        },
        'file skipped',
      )
    })
  })

  t.test('multiple results', async t => {
    t.test('select result', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        crossFetchPackageState: {
          ...DEFAULT_MOCK_CROSS_FETCH_PACKAGE_STATE,
          returnMultipleResults: true,
        },
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([TEST_INPUT_SHOW_FILE_NAME(1)]),
            TEST_MULTIPLE_RESULTS_ANSWER(TEST_INPUT_SHOW_FILE_NAME(1), 1),
            TEST_SHOW_RENAME_ANSWER(1),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_SHOWS_DIR]: 'directory',
          [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_FILE_PATH(1)]: 'file',
        },
        'file renamed',
      )
    })

    t.test('skip results', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1)]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        crossFetchPackageState: {
          ...DEFAULT_MOCK_CROSS_FETCH_PACKAGE_STATE,
          returnMultipleResults: true,
        },
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([TEST_INPUT_SHOW_FILE_NAME(1)]),
            TEST_MULTIPLE_RESULTS_ANSWER(TEST_INPUT_SHOW_FILE_NAME(1), null),
            TEST_SKIPPING_ANSWER(TEST_INPUT_SHOW_FILE_NAME(1)),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1)]: 'file',
        },
        'file skipped',
      )
    })
  })

  t.test('missing season', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_SHOW_FILE_PATH(1, {season: 20})]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('tv'),
          TEST_FILES_ANSWER([TEST_INPUT_SHOW_FILE_NAME(1, {season: 20})]),
          TEST_SEASON_ANSWER(1, {season: 20, answer: 1}),
          TEST_SHOW_RENAME_ANSWER(1, {
            season: 20,
            outputIndex: 1,
            outputSeason: 1,
          }),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_SHOWS_DIR]: 'directory',
        [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(1)]: 'file',
      },
      'file renamed',
    )
  })

  t.test('missing episode', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_SHOW_FILE_PATH(1, {episode: 20})]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('tv'),
          TEST_FILES_ANSWER([TEST_INPUT_SHOW_FILE_NAME(1, {episode: 20})]),
          TEST_EPISODE_ANSWER(1, {episode: 20, answer: 1}),
          TEST_SHOW_RENAME_ANSWER(1, {
            episode: 20,
            outputIndex: 1,
            outputEpisode: 1,
          }),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_SHOWS_DIR]: 'directory',
        [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_SHOW_FILE_PATH(1)]: 'file',
      },
      'file renamed',
    )
  })

  t.test('second episode', async t => {
    t.test('matching', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1, {secondEpisode: 2})]: 'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([
              TEST_INPUT_SHOW_FILE_NAME(1, {secondEpisode: 2}),
            ]),
            TEST_SHOW_RENAME_ANSWER(1, {secondEpisode: 2}),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_SHOWS_DIR]: 'directory',
          [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_FILE_PATH(1, {secondEpisode: 2})]: 'file',
        },
        'file renamed',
      )
    })

    t.test('missing episodes', async t => {
      const mockFSPackageState = {
        entries: {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_INPUT_SHOW_FILE_PATH(1, {episode: 20, secondEpisode: 21})]:
            'file',
        },
      }

      const {main} = requireMockMainModule({
        fsPackageState: mockFSPackageState,
        inquirerPackageState: {
          answers: [
            TEST_MODE_ANSWER('tv'),
            TEST_FILES_ANSWER([
              TEST_INPUT_SHOW_FILE_NAME(1, {episode: 20, secondEpisode: 21}),
            ]),
            TEST_FIRST_EPISODE_ANSWER(1, {
              episode: 20,
              secondEpisode: 21,
              answer: 1,
            }),
            TEST_SECOND_EPISODE_ANSWER(1, {
              episode: 20,
              secondEpisode: 21,
              answer: 2,
            }),
            TEST_SHOW_RENAME_ANSWER(1, {
              episode: 20,
              secondEpisode: 21,
              outputEpisode: 1,
              outputSecondEpisode: 2,
            }),
          ],
        },
      })

      await main()

      t.strictSame(
        mockFSPackageState.entries,
        {
          [TEST_INPUT_DIR]: 'directory',
          [TEST_SHOWS_DIR]: 'directory',
          [TEST_OUTPUT_SHOW_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_SEASON_DIR_PATH(1)]: 'directory',
          [TEST_OUTPUT_SHOW_FILE_PATH(1, {episode: 1, secondEpisode: 2})]:
            'file',
        },
        'file renamed',
      )
    })
  })
})

t.test('mk3d to mkv', async t => {
  t.test('enabled', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_MOVIE_FILE_PATH(1, {extension: '.mk3d'})]: 'file',
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([
            TEST_INPUT_MOVIE_FILE_NAME(1, {extension: '.mk3d'}),
          ]),
          TEST_MOVIE_RENAME_ANSWER(1, {
            extension: '.mk3d',
            outputExtension: '.mkv',
          }),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_MOVIES_DIR]: 'directory',
        [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(1, {extension: '.mkv'})]: 'file',
      },
      'file renamed',
    )
  })

  t.test('disabled', async t => {
    const mockFSPackageState = {
      entries: {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_INPUT_MOVIE_FILE_PATH(1, {extension: '.mk3d'})]: 'file',
      },
    }

    const mockConfPackageState = {
      values: {
        ...DEFAULT_MOCK_CONF_PACKAGE_STATE(DEFAULT_PROFILE_NAME).values,
        [`profiles.${DEFAULT_PROFILE_NAME}.renameMK3DToMKV`]: false,
      },
    }

    const {main} = requireMockMainModule({
      fsPackageState: mockFSPackageState,
      confPackageState: mockConfPackageState,
      inquirerPackageState: {
        answers: [
          TEST_MODE_ANSWER('movies'),
          TEST_FILES_ANSWER([
            TEST_INPUT_MOVIE_FILE_NAME(1, {extension: '.mk3d'}),
          ]),
          TEST_MOVIE_RENAME_ANSWER(1, {extension: '.mk3d'}),
        ],
      },
    })

    await main()

    t.strictSame(
      mockFSPackageState.entries,
      {
        [TEST_INPUT_DIR]: 'directory',
        [TEST_MOVIES_DIR]: 'directory',
        [TEST_OUTPUT_MOVIE_DIR_PATH(1)]: 'directory',
        [TEST_OUTPUT_MOVIE_FILE_PATH(1, {extension: '.mk3d'})]: 'file',
      },
      'file renamed',
    )
  })
})
