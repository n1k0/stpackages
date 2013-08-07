MOCHA_OPTS= --check-leaks
REPORTER = dot

dev:
	nodemon app.js

import:
	bin/stpackages import

index:
	bin/stpackages backup
	bin/stpackages index

install:
	npm install

jshint:
	@./node_modules/jshint/bin/jshint *.js static test

revert:
	bin/stpackages revert

run:
	node app.js

sync: import index

test: test-unit jshint

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) $(MOCHA_OPTS) test

.PHONY: dev import index install jshint revert run sync test test-unit
