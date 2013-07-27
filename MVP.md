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

### Tagging script

(investigating)

Manual tagging of packages using a cli script.

Use scenarios:

#### Tag packages

(investigating)

Interactively ask tags for untagged packages:

```
$ make tag
Package foo at https://github.com/xxx/foo is untagged, please enter tags:
tag1 tag2 tag3
Package bar at https://github.com/xxx/bar is untagged, please enter tags:
tag2 tag4
...
```

#### Tag a single package

(investigating)

To set/add tags for a single package:

```
$ make tag <slug> tag1 tag2 tag3
<slug> has been tagged with tag1 tag2 tag3.
```

To replace tags for a single package:

```
$ make tag <slug> tag1 tag2 tag3 --replace
<slug> tags have been replaced with tag1 tag2 tag3.
```

### List packages

Constraints:

* √ <del>only packages hosted on Gihub (for now) [filter]</del>

Information to display:

- by ST version compatibility (2, 3, 2+3) [custom]
- by name ASC
- by github stargazers DESC
- by date added DESC
- by date updated DESC
- by tag (investigating)
- by searched term (use [search-index](https://github.com/fergiemcdowall/search-index))

### View package details

Information to display:

- name
- github url
- ST version compatibility
- tags (investigating)
- README, if any
- author, if any

### Tag a package

Admin job only (suggestion of new tags by email)

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

Future
======

- trends (keeping track of stargazer count)
