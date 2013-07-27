/* jshint es5:true */
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

function PackageQuery(packages) {
  this.packages = packages;
}
exports.PackageQuery = PackageQuery;

PackageQuery.prototype = {
  get length() {
    return this.packages.length;
  },

  all: function() {
    return this.packages;
  },

  at: function(index) {
    if (!this.packages.length || typeof this.packages[index] === "undefined")
      throw new Error("No record at position " + index);
    return this.packages[index];
  },

  first: function() {
    return this.at(0);
  },

  filter: function(constraints) {
    this.packages = this.packages.filter(function(pkg) {
      for (var name in constraints) {
        if (Array.isArray(pkg[name]))
          return pkg[name].indexOf(constraints[name]) !== -1;
        if (pkg[name] !== constraints[name])
          return false;
      }
      return true;
    });
    return this;
  },

  order: function(name, direction) {
    if (!direction) direction = 'ASC';
    var step = direction.toUpperCase() === 'ASC' ? 1 : -1;
    this.packages = this.packages.sort(function(pkg1, pkg2) {
      return pkg1[name] > pkg2[name] ? step : -step;
    });
    return this;
  },

  findFirstBySlug: function(slug) {
    return this.filter({slug: slug}).first();
  },

  findByTag: function(tag) {
    return this.filter({tags: tag});
  }
};
