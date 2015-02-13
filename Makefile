install:
	npm install
	bower install

build-app:
	gulp build

build-docs:
	gulp docs

sync:
	s3cmd --delete-removed --acl-public --add-header="Cache-Control: no-cache" --config=.s3cfg sync $(source) $(dest)

sync-app:
	$(MAKE) sync source=./.tmp/build/* dest=s3://demo.zooniverse.org/oldweather/

sync-docs:
	$(MAKE) sync source=./.tmp/docs/* dest=s3://demo.zooniverse.org/oldweatherdocs/

deploy-app: build-app sync-app

deploy-docs: build-docs sync-docs

deploy: deploy-app deploy-docs
