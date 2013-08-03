MOCHA_OPTS= --check-leaks
REPORTER = dot

dev:
	nodemon app.js

import:
	rm -rf data/*.json
	node import.js

index:
	rm -rf norchindex/*
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

test-functional:
	@forever start app.js > /dev/null
	@sleep 1
	casperjs test test/casper
	@forever stopall > /dev/null

.PHONY: dev import index install jshint run sync test test-unit
