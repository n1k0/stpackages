var async = require('async');
var fs = require('fs');
var path = require('path');

function load(dataDir, cb) {
  fs.readdir(dataDir, function(err, files) {
    if (err) return cb(err);
    async.reduce(files, [], function(memo, file, cb) {
      if (err) return cb(err);
      fs.readFile(path.join(dataDir, file), function(err, json) {
        if (err) return cb(err);
        try {
          memo.push(JSON.parse(json));
        } catch (err) {
          return cb('JSON parse error: ' + err);
        }
        cb(null, memo);
      });
    }, cb);
  });
}
exports.load = load;

function findBySlug(packages, slug) {
  var found = packages.filter(function(pkg) {
    return pkg.slug === slug;
  })[0];

  if (!found)
    throw new Error("Package with slug=" + slug + " not found");

  return found;
}
exports.findBySlug = findBySlug;
