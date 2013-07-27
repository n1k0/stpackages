StPackages
==========

(name subject to change)

This is a nodejs Web application listing sublime text packages.

Installation
------------

    $ npm install

Import
------

An import script is provided to import existing packages living in [Package Control](); you need to set the `GITHUB_API_TOKEN` env var to make it work:

    $ GITHUB_API_TOKEN=gsdgg6hg54jh800bjb566 make import.js

Run
---

Development:

You should use [nodemon](https://github.com/remy/nodemon), then:

    $ nodemon app.js

Production:

    $ node app.js

Test
----

    $ npm test
