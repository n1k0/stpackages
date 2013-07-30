MVP
===

## Features

### Import script

- √ <del>Import initial packages database using [Package Control JSON db] as a source.</del>
- √ <del>Don't override package database files if they exist.</del>

### Sync script

- √ <del>basically reimport all the data :)</del>

### List packages

Constraints:

* √ <del>only packages hosted on Gihub (for now) [filter]</del>

Information to display:

- √ <del>by popularity DESC</del>
- √ <del>by date added DESC</del>
- √ <del>by date updated DESC</del>
- √ <del>by searched term (use [search-index](https://github.com/fergiemcdowall/search-index))</del>

### View package details

Information to display:

- √ <del>name</del>
- √ <del>github url</del>
- √ <del>README, if any</del>
- √ <del>author, if any</del>

### HTML/CSS

- √ <del>homepage</del>
- √ <del>list</del>
- √ <del>details</del>
- √ <del>search</del>
- √ <del>about</del>

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

# Future

- add info for ST version compatibility (2, 3, 2+3) [custom]

[Package Control JSON db]: https://raw.github.com/wbond/package_control_channel/master/repositories.json
