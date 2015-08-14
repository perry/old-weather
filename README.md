# Old Weather

## Installation

1. Clone the repo
2. Run `make install` inside the repo directory

## Development

Running `gulp` starts the project at http://localhost:8000/, and the ngDoc server at http://localhost:8001/. There are git hooks to run JSLint on commit.

## Deployment

- Requires `s3cmd`

Running `make deploy` deploys both project and docs to http://demo.zooniverse.org/oldweather/ and http://demo.zooniverse.org/oldweatherdocs/ respectively. You'll need to have the `AMAZON_ACCESS_KEY_ID` and `AMAZON_SECRET_ACCESS_KEY` environment variables set.
