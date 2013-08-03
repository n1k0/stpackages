MOCHA_OPTS= --check-leaks
REPORTER = dot

dev:
	nodemon app.js

import:
	mv data data.bck
	mkdir data
	node import.js

index:
	node index-db.js

install:
	npm install

jshint:
	@./node_modules/jshint/bin/jshint *.js static test

run:
	node app.js

sync: import index

test: jshint test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) $(MOCHA_OPTS) test

.PHONY: dev import index install jshint run sync test test-unit
