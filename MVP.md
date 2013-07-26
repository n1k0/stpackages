MVP
===

## Features

### Import script

Import packages using [Package Control JSON db](https://raw.github.com/wbond/package_control_channel/master/repositories.json)

### List packages

Constraints:

- only packages hosted on Gihub (for now) [filter]

Information to display:

- by ST version compatibility (2, 3, 2+3) [custom]
- by name ASC
- by github stargazers DESC
- by date added DESC
- by date updated DESC
- by tag [custom]

### View package details

Information to display:

- name
- github url
- ST version compatibility
- tags
- README, if any
- author, if any

### Tag a package

Admin job only (suggestion of new tags by email)

### Submit a package

Basically a form which sends me an email.

## Technical

* Use the github API (check if creds are needed)
* Data consumption
    - github [PC JSON file](https://raw.github.com/wbond/package_control_channel/master/repositories.json)
* repo API:
    - name will be fetched from PC json file
    - `description`
    - `watchers_count` for stargazer count
    - `pushed_at` for latest update date
    - `open_issues_count` for nb of opened issues
    - `homepage` for homepage URL
    - `fork` to see if it's a fork
* README will be fetched and rendered client side
