# video-clerk

A CLI for organizing movie and TV show files.

As of now, it fetches information from [TMDb](https://www.themoviedb.org/) and
moves and renames your video files.

## Installation

```bash
npm install -g video-clerk
```

## Usage

```bash
video-clerk
```

On first run, you'll be asked to supply some configuration information,
including an access token for TheMovieDB and the location of your video files.
After that, just follow the prompts.

You can also supply the configuration information via command line arguments.
Use the `--help` argument for more information.
