MOCHA_OPTS= --check-leaks
REPORTER = dot

import:
	node import.js

run:
	node app.js

test: test-unit

test-unit:
	@NODE_ENV=test ./node_modules/.bin/mocha --reporter $(REPORTER) $(MOCHA_OPTS) test

.PHONY: import run test test-unit
