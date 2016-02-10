# Old Weather

The fifth incarnation of OW, built as a custom Angular app. This is a little different from other Zoo apps as it uses a `Makefile` along with Gulp to carry out build / deployment tasks.

## Installation

1. Clone the repo
2. Run `make install` inside the repo directory

## Development

Running `make run` starts the project at `http://localhost:8000/`, and the ngDoc server at `http://localhost:8001/`. There are git hooks to run JSLint on commit.

## Deployment

- Requires `s3cmd`, and the `AMAZON_ACCESS_KEY_ID` and `AMAZON_SECRET_ACCESS_KEY` environment variables set.

Running `make deploy-preview` deploys both project and docs to `http://demo.zooniverse.org/oldweather/` and `http://demo.zooniverse.org/oldweatherdocs/` respectively.

Running `make deploy-production` deploys the project only to `http://www.oldweather.org`

## Gotchas / weirdnesses

- The build task _doesn't_ rebuild the project templates, so if you're just looking to do a simple HTML change, you'll need to e.g. run the dev server for those changes to take effect.