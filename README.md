StPackages
==========

(name subject to change)

This is a nodejs Web application listing sublime text packages.

Installation
------------

    $ make install

Be sure to create a `data` directory at the root of the project installation:

    $ mkdir data

This directory *MUST* be writeable by the system user running the import/sync script.

Import
------

An import script is provided to import existing packages living in [Package Control](http://wbond.net/sublime_packages/package_control); you need to set the `GITHUB_API_TOKEN` env var to make it work:

    $ GITHUB_API_TOKEN=gsdgg6hg54jh800bjb566 make import

This script is also used to resync the data:

    $ GITHUB_API_TOKEN=gsdgg6hg54jh800bjb566 make sync

Indexation
----------

Then data should be indexed for the search engine to work:

    $ make index

Run
---

Development:

Be sure to have [nodemon](https://github.com/remy/nodemon) installed, then:

    $ make dev

Production:

    $ make run

Test
----

    $ make test

License
-------

[MIT](http://opensource.org/licenses/MIT)
