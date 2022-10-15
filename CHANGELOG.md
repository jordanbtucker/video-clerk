# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.2.0 - 2022-10-15

### Features

- Profiles are available via the `--profile` command line argument. If omitted,
  the default profile will be used, which is the same as using
  `--profile default`.

## 2.1.0 - 2022-09-15

### Features

- When no results are found, you are now prompted to enter a title.
- Files can be skipped by entering a blank title when prompted or by choosing
  the Skip option in a list of results.

### Fixes

- Fixed a bug where the second episode title would not be appended to the
  filename if it could not be matched but was selected from a list.

## 2.0.1 - 2022-09-14

### Fixes

- Fixed typo for word `unable`.

## 2.0.0 - 2022-09-14

### BREAKING CHANGES

- Years are always included in TV show folders and filenames.

### Fixes

- Fixed a bug where a second episode number was erroneously matched.

## 1.1.0 - 2022-09-11

### Features

- A second episode can be matched in a filename, e.g.
  `The Office (2005) - S01E01-E02.mkv`.

## 1.0.1 - 2022-09-04

### Fixes

- Fixed a bug where inquirer only supported `import` instead of `require`.

## 1.0.0 - 2022-09-04

### BREAKING CHANGES

- Support for Node.js v12 has been removed. The mimimum supported version is
  v14.

### Features

- Support for TV show years and season/episode number separates by space wrapped
  hyphens, e.g. `The Office (2005) - S01E01 - Pilot.mkv`.

## 0.8.0 - 2022-02-05

### Features

- Years in TV show filenames are now supported.

## 0.7.1 - 2022-01-13

### Fixes

- Filenames will be shown instead of titles when multiple results are found.

## 0.7.0 - 2022-01-08

### Features

- Spaces in filenames for movies are now supported. The year can be surrounded
  by parentheses.

### Fixes

- Fixed a bug that caused the the title from TMDb to not be used.
- Fixed a typo in the help.

## 0.6.2 - 2022-01-08

### Fixes

- Added missing documentation for the Rename MK3D to MKV setting.

## 0.6.1 - 2022-01-08

### Fixes

- Fixed a bug that caused the Rename MK3D to MKV setting to not save.

## 0.6.0 - 2022-01-08

### Features

- `*.mk3d` files are now renamed to `*.mkv` since Plex does not support `*.mk3d`
  files. This setting can be configured.

## 0.5.0 - 2022-01-08

### Features

- `*.mk3d` files are now supported.

## 0.4.1 - 2021-12-05

### Fixes

- Patched a security vulnerability.

## 0.4.0 - 2021-12-05

### Features

- Command line arguments are now supported for overriding configuration on a per
  run basis.

## 0.3.0 - 2021-06-07

### Fixes

- Spaces in filenames for TV shows are now supported.

## 0.2.1 - 2021-04-14

### Fixes

- Letter casing is ignored when matching.

## 0.2.0 - 2020-07-06

### Features

- Episode numbers are shown in lists.
- Data is cached to reduce API calls.

## 0.1.2 - 2020-06-15

### Fixes

- TV shows are now moved to their correct season folder.

## 0.1.1 - 2020-05-17

### Fixes

- Fixed an issue with package-lock.json produced a warning regarding ESLint.

## 0.1.0 - 2020-05-17

### Features

- All features necessary to fetch data from TMDb and rename movie and TV show
  files.
