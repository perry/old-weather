# Old Weather

The fifth incarnation of OW, built as a custom Angular app. This is a little different from other Zoo apps as it uses a `Makefile` along with Gulp to carry out build / deployment tasks.

## Requirements

- Node / NPM
- Bower
  * `npm install -g bower`
- s3cmd
  * `brew install s3cmd` if on OS X

## Installation

1. Clone the repo
2. Run `make install` inside the repo directory

## Development

Running `make run` starts the project at `http://localhost:8000/`, and the ngDoc server at `http://localhost:8001/`. There are git hooks to run JSLint on commit.

## Deployment

- Requires the environment variables `AMAZON_ACCESS_KEY_ID` and `AMAZON_SECRET_ACCESS_KEY`

Running `make deploy-preview` deploys both project and docs to `http://demo.zooniverse.org/oldweather/` and `http://demo.zooniverse.org/oldweatherdocs/` respectively.

Running `make deploy-production` deploys the project only to `http://www.oldweather.org`

- If you get errors when trying to deploy and you haven't run the dev `make run` cmd, then run the default gulp task to build the required files.
  - `gulp`

## Adding new subject sets

1. Upload your new set to Panoptes
1. Associate the new subject set with the `Annotation` workflow in the workflow editor
1. Modify your subject set metadata to include the following data (both strings):
    ```
    metadata: {
        active: "true",
        shortName: "SHIP_NAME"
    }
    ```
1. Add any extra info to `ShipsDetailConstants` as required

## Gotchas / weirdnesses

- The build task _doesn't_ rebuild the project templates, so if you're just looking to do a simple HTML change, you'll need to e.g. run the dev server for those changes to take effect.
