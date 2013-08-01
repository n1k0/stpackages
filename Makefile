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

run:
	node app.js

sync:
	make import
	make index

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) $(MOCHA_OPTS) test

.PHONY: dev import index install run sync test test-unit
