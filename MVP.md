MVP
===

## Features

### Import script

- √ <del>Import initial packages database using [Package Control JSON db] as a source.</del>
- √ <del>Don't override package database files if they exist.</del>

### Sync script

* update latest information for a given package:
    - number of stargazers
    - number of issues
    - latest update date
    - description
    - latest version of README

**Note:** don't deal with renamed or moved packages for now.

### List packages

Constraints:

* √ <del>only packages hosted on Gihub (for now) [filter]</del>

Information to display:

- by ST version compatibility (2, 3, 2+3) [custom]
- by name ASC
- by github stargazers DESC
- by popularity DESC
- by date added DESC
- by date updated DESC
- by searched term (use [search-index](https://github.com/fergiemcdowall/search-index))

### View package details

Information to display:

- name
- github url
- ST version compatibility
- README, if any
- author, if any

### Submit a package

Basically a form which sends me an email.

## Technical

* √ <del>Use the github API (check if creds are needed)</del>
* <del>Data consumption</del>
    - √ <del>github [Package Control JSON db]</del>
* <del>repo API:</del>
    - √ <del>name will be fetched from PC json file</del>
    - √ <del>`description`</del>
    - √ <del>`watchers_count` for stargazer count</del>
    - √ <del>`pushed_at` for latest update date</del>
    - √ <del>`open_issues_count` for nb of opened issues</del>
    - √ <del>`homepage` for homepage URL</del>
    - √ <del>`fork` to see if it's a fork</del>
    - √ <del>`readme` to be fetched using the github api and stored as </del>markdown source
*


[Package Control JSON db]: https://raw.github.com/wbond/package_control_channel/master/repositories.json
