/* jshint camelcase:false */
var fs = require('fs');
var path = require('path');
var events = require('events');
var util = require('util');
var async = require('async');
var libutil = require('./util');

var SearchClient = require('elasticsearchclient');
var scoreScript = "_score * (doc['nbStargazers'].value + 1)";

function buildFacets() {
  return {
    st3compat: {
      terms: [{
        field: "st3compat"
      }],
      global: true
    },
    platforms: {
      terms: [{
        field: "platforms"
      }],
      global: true
    }
  };
}

function buildQuery(filters) {
  if (!filters)
    return {match_all: {}};
  return {
    bool: {
      must: Object.keys(filters).map(function(field) {
        var term = {};
        term[field] = filters[field];
        return {term: term};
      })
    }
  };
}

function buildRecentQuery(options) {
  return {
    from: options && options.offset,
    size: options && options.perPage,
    sort: [{createdAt: "desc"}],
    query: buildQuery(options && options.filters),
    facets: buildFacets()
  };
}

function buildUpdatedQuery(options) {
  return {
    from: options && options.offset,
    size: options && options.perPage,
    sort: [{updatedAt: "desc"}],
    query: buildQuery(options && options.filters),
    facets: buildFacets()
  };
}

function buildPopularQuery(options) {
  return {
    from: options && options.offset,
    size: options && options.perPage,
    query: {
      custom_score: {
        query: buildQuery(options && options.filters),
        script: scoreScript
      }
    },
    facets: buildFacets()
  };
}

function buildSearchQuery(q, options) {
  function filterConstraints(filters) {
    try {
      return buildQuery(filters).bool.must;
    } catch (e) {
      return [];
    }
  }
  return {
    from: options && options.offset,
    size: options && options.perPage,
    query: {
      custom_score: {
        query: {
          bool: {
            must: [{
              query_string : { // XXX: add faceting filters to query
                default_operator: "AND",
                fields : [
                  "name^20",
                  "description^10",
                  "readme^.25",
                  "author"
                ],
                query : q,
                use_dis_max : false
              }
            }].concat(filterConstraints(options && options.filters))
          }
        },
        script: scoreScript
      }
    },
    facets: buildFacets()
  };
}

function formatResults(data) {
  data = data || {};
  return {
    total: data.hits && data.hits.total,
    packages: data.hits && data.hits.hits.map(function(hit) {
      return hit._source;
    }),
    facets: data.facets && Object.keys(data.facets).map(function(field) {
      var facet = data.facets[field];
      return {
        field: field,
        terms: facet.terms
      };
    })
  };
}

function SearchIndex(options) {
  this.options = libutil.extend({
    backupDir: path.join(__dirname, '..', 'backup'),
    indice: "stpackages",
    type: "package"
  }, options || {});
  this.client = this.createClient();
}
util.inherits(SearchIndex, events.EventEmitter);
exports.SearchIndex = SearchIndex;

SearchIndex.prototype.createClient = function() {
  var options = {
    host: process.env.ELASTICSEARCH_HOST || 'localhost',
    port: ~~process.env.ELASTICSEARCH_PORT || 9200,
    secure: false
  };
  if (process.env.ELASTICSEARCH_USERNAME) {
    options.auth = {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    };
  }
  return new SearchClient(options);
};

SearchIndex.prototype.getPackage = function(slug, cb) {
  // XXX use getPackages and pop first result?
  this.client
    .get(this.options.indice, this.options.type, slug)
    .on('error', cb)
    .on('data', function(data) {
      cb(null, JSON.parse(data)._source);
    })
    .exec();
};

SearchIndex.prototype.getPackages = function(query, cb) {
  query = query || {query: {match_all: {}}};
  this.client
    .search(this.options.indice, this.options.type, query)
    .on('error', cb)
    .on('data', function(data) {
      try {
        cb(null, formatResults(JSON.parse(data)));
      } catch (err) {
        cb(err);
      }
    })
    .exec();
};

SearchIndex.prototype.getRecentPackages = function(options, cb) {
  this.getPackages(buildRecentQuery(options), cb);
};

SearchIndex.prototype.getUpdatedPackages = function(options, cb) {
  this.getPackages(buildUpdatedQuery(options), cb);
};

SearchIndex.prototype.getPopularPackages = function(options, cb) {
  this.getPackages(buildPopularQuery(options), cb);
};

SearchIndex.prototype.searchPackages = function(q, options, cb) {
  this.getPackages(buildSearchQuery(q, options), cb);
};

SearchIndex.prototype.dropAll = function(cb) {
  this.client
    .deleteIndex(this.options.indice)
    .on('error', cb)
    .on('data', function(data) {
      cb(null, data);
    })
    .exec();
};

SearchIndex.prototype.loadAll = function(cb) {
  this.getPackages({
    from: 0,
    size: 9999999,
    query: {
      match_all: {}
    },
  }, cb);
};

SearchIndex.prototype.dump = function(cb) {
  this.loadAll(function(err, data) {
    if (err)
      return cb(err);
    if (!data || !data.packages || data.packages.length === 0)
      return cb(new Error("Won't dump an empty database"));
    try {
      cb(null, JSON.stringify(data, null, 2));
    } catch(err) {
      cb(err);
    }
  });
};

SearchIndex.prototype.dumpToFile = function(file, cb) {
  this.dump(function(err, jsonData) {
    if (err)
      return cb(err);
    fs.writeFile(file, jsonData, function(err) {
      if (err)
        return cb(err);
      cb(null, 'Data backuped to ' + file);
    });
  });
};

SearchIndex.prototype.backup = function(cb) {
  var fileName = (new Date())
                  .toISOString()
                  .replace(/( |:|\/)+/g, '-')
                  .split('.')[0] + '.json';
  var backupFile = path.join(this.options.backupDir, fileName);
  this.dumpToFile(backupFile, cb);
};

SearchIndex.prototype.indexPackage = function(pkg, cb) {
  this.client
    .index(this.options.indice, this.options.type, pkg, pkg.slug)
    .on('error', cb)
    .on('data', function(data) {
      this.emit("info", "indexed package", pkg.name);
      cb(null, JSON.parse(data));
    })
    .exec();
};

SearchIndex.prototype.indexPackageSync = function(pkg, cb) {
  this.client
    .index(this.options.indice, this.options.type, pkg, pkg.slug, {refresh: true})
    .on('error', cb)
    .on('data', function(data) {
      this.emit("info", "indexed package", pkg.name);
      cb(null, JSON.parse(data));
    })
    .exec();
};

SearchIndex.prototype.updatePackage = function(slug, data, cb) {
  this.client
    .update(this.options.indice, this.options.type, slug, {
      doc: data
    })
    .on('error', cb)
    .on('data', function(data) {
      cb(null, JSON.parse(data));
    })
    .exec();
};

SearchIndex.prototype.loadFromFile = function(file, cb) {
  if (!fs.existsSync(file))
    return cb(new Error("File not found: " + file));
  fs.readFile(file, "utf-8", function(err, json) {
    if (err)
      return cb(err);
    try {
      var packages = JSON.parse(json).packages;
      async.map(packages, this.indexPackageSync.bind(this), cb);
    } catch(err) {
      cb(err);
    }
  }.bind(this));
};

SearchIndex.prototype.listBackups = function() {
  return fs.readdirSync(path.join(this.options.backupDir))
    .filter(function(file) {
      return (/\.json$/).test(file);
    })
    .map(function(backupFile) {
      var backupPath = path.join(this.options.backupDir, backupFile);
      return {
        name: backupFile,
        path: backupPath,
        length: JSON.parse(fs.readFileSync(backupPath)).packages.length
      };
    }.bind(this))
    .sort(function(b1, b2) {
      return b1.name > b2.name ? -1 : 1;
    });
};

SearchIndex.prototype.restore = function(name, cb) {
  var backup = this.listBackups().filter(function(backup) {
    return backup.name === name;
  })[0];
  if (!backup)
    return cb(new Error('No backup named ' + name));
  this.loadFromFile(backup.path, function(err, results) {
    if (err)
      return cb(err);
    cb(null, "Imported " + results.length + " packages from " + name);
  });
};

SearchIndex.prototype.revert = function(cb) {
  var backups = this.listBackups();
  if (backups.length === 0)
    return cb(new Error("No JSON backup available in " + this.options.backupDir));
  var backup = backups[0];
  this.client.deleteIndex(this.options.indice)
    .on('error', cb)
    .on('data', function() {
      this.loadFromFile(backup.path, function(err, data) {
        if (err)
          return cb(err);
        cb(null, "Reimported " + data.length + " packages from " + backup.name);
      });
    }.bind(this))
    .exec();
};

SearchIndex.prototype.updateCompatData = function(compatData, cb) {
  this.loadAll(function(err, data) {
    if (err)
      return cb(err);
    async.map(data.packages, function(pkg, cb) {
      if (!(pkg.url in compatData))
        return cb(null, pkg); // skip update
      this.updatePackage(pkg.slug, {
        st3compat: compatData[pkg.url]
      }, cb);
    }.bind(this), cb);
  }.bind(this));
};
