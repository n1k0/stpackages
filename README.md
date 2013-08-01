SublimePackages.com
===================

[SublimePackages] is a [nodejs] Web application listing sublime text packages.

[![Build Status](https://travis-ci.org/n1k0/stpackages.png?branch=master)](https://travis-ci.org/n1k0/stpackages)

Installation
------------

    $ make install

Setup
-----

## Data directory

Be sure to create a `data` directory at the root of the project installation:

    $ mkdir data

This directory *MUST* be writeable by the system user running the import/sync
script.

## Import

An import script is provided to import existing packages living in
[Package Control].

Detailled data will be fetched using the [Github API], so you need to set the
`GITHUB_API_TOKEN` env var to make it work; eg. if your API token is
`gsdgg6hg54jh800bjb566`:

    $ GITHUB_API_TOKEN=gsdgg6hg54jh800bjb566 make import

This script is also used to resync the data:

    $ GITHUB_API_TOKEN=gsdgg6hg54jh800bjb566 make sync

## Syncing

    $ make sync

## Indexation

Then data should be indexed for the search engine to work:

    $ make index

Run
---

Development:

Be sure to have [nodemon] installed, then:

    $ make dev

Production:

    $ make run

**Hint:** It may be a good idea to use something like [forever] to ensure the app is always live:

    $ npm install forever
    $ forever start app.js

Test
----

    $ make test

License
-------

[MIT]



[forever]: http://npmjs.org/package/forever
[Github API]: http://developer.github.com/
[MIT]: http://opensource.org/licenses/MIT
[nodejs]: http://nodejs.org/
[nodemon]: https://github.com/remy/nodemon
[Package Control]: http://wbond.net/sublime_packages/package_control
[SublimePackages]: http://sublimepackages.com/
