# video-clerk

[![Build Status](https://app.travis-ci.com/jordanbtucker/video-clerk.svg?branch=main)](https://app.travis-ci.com/jordanbtucker/video-clerk)
[![Coverage Status](https://coveralls.io/repos/github/jordanbtucker/video-clerk/badge.svg?branch=main)](https://coveralls.io/github/jordanbtucker/video-clerk?branch=main)

A CLI for organizing movie and TV show files.

As of now, it fetches information from
[The Movie Database](https://www.themoviedb.org/) and moves and renames your
video files using the
[Plex format](https://support.plex.tv/articles/naming-and-organizing-your-movie-media-files/).

## Installation

```bash
npm install -g video-clerk
```

## Usage

```bash
video-clerk
```

On first run, you'll be asked to supply some configuration information,
including an [access token](https://www.themoviedb.org/settings/api) for TMDB
and the location of your video files. After that, just follow the prompts.

You can also supply the configuration information via command line arguments.
Use the `--help` argument for more information.
