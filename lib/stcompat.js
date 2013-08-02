var request = require('request');

var compatSourceURL = [
  'https://raw.github.com/wiki',
  '/wbond/sublime_package_control/Sublime-Text-3-Compatible-Packages.md'
].join('');

function parseCompatData(data) {
  var packageCompatInfo = {};
  data.split('\n\n## ').slice(1, 5).forEach(function(rawSection) {
    var lines = rawSection.split('\n');
    var compat = lines[0].split(' ##')[0];
    var packages = lines.slice(1).forEach(function(line) {
      var match = /^\*\s?\[(.+)\]\(([^\)]*)\)/i.exec(line);
      if (!match) return;
      var cleanUrl = match[2]
                      .replace(/\.git$/, '')
                      .replace('http://github', 'https://github');
      packageCompatInfo[cleanUrl] = compat;
    });
  });
  return packageCompatInfo;
}

function getCompatData(cb) {
  request.get(compatSourceURL, function(err, res, body) {
    if (err)
      return cb(err);
    try {
      cb(null, parseCompatData(body));
    } catch(err) {
      cb(err);
    }
  });
}
exports.getCompatData = getCompatData;
