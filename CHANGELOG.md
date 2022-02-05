# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.8.0 - 2022-02-05

### Added

- Years in TV show filenames are now supported.

## 0.7.1 - 2022-01-13

### Changed

- Filenames will be shown instead of titles when multiple results are found.

## 0.7.0 - 2022-01-08

### Added

- Spaces in filenames for movies are now supported. The year can be surrounded
  by parentheses.

### Fixed

- Fixed a bug that caused the the title from TMDb to not be used.
- Fixed a typo in the help.

## 0.6.2 - 2022-01-08

### Fixed

- Added missing documentation for the Rename MK3D to MKV setting.

## 0.6.1 - 2022-01-08

### Fixed

- Fixed a bug that caused the Rename MK3D to MKV setting to not save.

## 0.6.0 - 2022-01-08

### Added

- `*.mk3d` files are now renamed to `*.mkv` since Plex does not support `*.mk3d`
  files. This setting can be configured.

## 0.5.0 - 2022-01-08

### Added

- `*.mk3d` files are now supported.

## 0.4.1 - 2021-12-05

### Fixed

- Patched a security vulnerability.

## 0.4.0 - 2021-12-05

### Added

- Command line arguments are now supported for overriding configuration on a per
  run basis.

## 0.3.0 - 2021-06-07

### Fixed

- Spaces in filenames for TV shows are now supported.

## 0.2.1 - 2021-04-14

### Fixed

- Letter casing is ignored when matching.

## 0.2.0 - 2020-07-06

### Added

- Episode numbers are shown in lists.
- Data is cached to reduce API calls.

## 0.1.2 - 2020-06-15

### Fixed

- TV shows are now moved to their correct season folder.

## 0.1.1 - 2020-05-17

### Fixed

- Fixed an issue with package-lock.json produced a warning regarding ESLint.

## 0.1.0 - 2020-05-17

### Added

- All features necessary to fetch data from TMDb and rename movie and TV show
  files.
