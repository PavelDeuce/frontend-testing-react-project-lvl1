install: install-deps

page-loader:
	node src/bin/page-loader.js

install-deps:
	npm ci

test:
	DEBUG=nock.common,page-loader*,axios npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish --dry-run
