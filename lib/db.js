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

function PackageQuery(records) {
  this.records = records;
}
exports.PackageQuery = PackageQuery;

PackageQuery.prototype = {
  get length() {
    return this.records.length;
  },

  toJSON: function() {
    return JSON.stringify(this.records, null, 2);
  },

  all: function() {
    return this.records;
  },

  at: function(index) {
    if (!this.records.length || typeof this.records[index] === "undefined")
      throw new Error("No record at position " + index);
    return this.records[index];
  },

  first: function() {
    return this.at(0);
  },

  except: function() {
    var fields = [].slice.call(arguments);
    if (!fields.length)
      return this;
    this.records = this.records.map(function(record) {
      return fields.reduce(function(obj, field) {
        delete obj[field];
        return obj;
      }, record);
    });
    return this;
  },

  only: function() {
    var fields = [].slice.call(arguments);
    if (!fields.length)
      return this;
    this.records = this.records.map(function(record) {
      return fields.reduce(function(obj, field) {
        obj[field] = record[field];
        return obj;
      }, {});
    });
    return this;
  },

  filter: function(constraints) {
    this.records = this.records.filter(function(pkg) {
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
    this.records = this.records.sort(function(pkg1, pkg2) {
      return pkg1[name] > pkg2[name] ? step : -step;
    });
    return this;
  },

  limit: function() {
    var start = 0, max;
    if (arguments.length === 1) {
      max = ~~arguments[0];
    } else if (arguments.length === 2) {
      start = ~~arguments[0];
      max = ~~arguments[1] + 1;
    } else
      return this;
    this.records = this.records.slice(start, max);
    return this;
  },

  findFirstBySlug: function(slug) {
    return this.filter({slug: slug}).first();
  },

  findByTag: function(tag) {
    return this.filter({tags: tag});
  }
};
