help:
	@echo "Usage"
	@echo "  make install          - install the NPM and Bower requirements"
	@echo "  make run              - run the development server"
	@echo "  make deploy-preview   - deploy site and docs to preview.zooniverse.org/oldweather and preview.zooniverse.org/oldweatherdocs"
	@echo "  make deploy-production   - deploy site to www.oldweather.org"

install:
	npm install
	bower install

build-app:
	gulp build

build-docs:
	gulp docs

sync:
	s3cmd --access_key=$(AMAZON_ACCESS_KEY_ID) --secret_key=$(AMAZON_SECRET_ACCESS_KEY) --delete-removed --acl-public --add-header="Cache-Control: no-cache" --no-mime-magic --guess-mime-type --bucket-location=us-east-1 sync $(source) $(dest)

sync-app-production:
	$(MAKE) sync source=./.tmp/build/* dest=s3://zooniverse-static/arctic.oldweather.org/

sync-app-preview:
	$(MAKE) sync source=./.tmp/build/* dest=s3://zooniverse-static/preview.zooniverse.org/oldweather/

sync-docs-preview:
	$(MAKE) sync source=./.tmp/docs/* dest=s3://zooniverse-static/preview.zooniverse.org/oldweatherdocs/

deploy-app-preview: build-app sync-app-preview

deploy-app-production: build-app sync-app-production

deploy-docs-preview: build-docs sync-docs-preview

deploy-preview: deploy-app-preview deploy-docs-preview

deploy-production: deploy-app-production

run:
	gulp
