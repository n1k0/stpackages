var fs = require('fs');
var path = require('path');
var async = require('async');

var SearchClient = require('elasticsearchclient');
var scoreScript = "_score * (doc['nbStargazers'].value + 1)";

var BACKUP_DIR = path.join(__dirname, '..', 'backup');
var PACKAGES_INDICE = "stpackages";
var PACKAGE_TYPE = "package";

function createClient() {
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
}
exports.createClient = createClient;

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

function buildFacetsQuery() {
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

function sendSearchResults(res, query) {
  createClient()
    .search(PACKAGES_INDICE, PACKAGE_TYPE, query)
    .on('data', function(data) {
      try {
        res.json(formatResults(JSON.parse(data)));
      } catch (err) {
        console.error(err);
        res.json(500, err);
      }
    })
    .on('error', function(err) {
      res.json(500, err);
    })
    .exec();
}
exports.sendSearchResults = sendSearchResults;

function sendPackage(res, slug) {
  createClient()
    .get(PACKAGES_INDICE, PACKAGE_TYPE, slug)
    .on('data', function(data) {
      res.send(JSON.parse(data)._source);
    })
    .on('error', function(err) {
      res.json(500, err);
    })
    .exec();
}
exports.sendPackage = sendPackage;

function buildQuery(filters) {
  /* jshint camelcase:false */
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

function recentPackages(res, options) {
  /* jshint camelcase:false */
  sendSearchResults(res, {
    from: options && options.offset,
    size: options && options.perPage,
    sort: [{createdAt: "desc"}],
    query: buildQuery(options && options.filters),
    facets: buildFacetsQuery()
  });
}
exports.recentPackages = recentPackages;

function updatedPackages(res, options) {
  /* jshint camelcase:false */
  sendSearchResults(res, {
    from: options && options.offset,
    size: options && options.perPage,
    sort: [{updatedAt: "desc"}],
    query: buildQuery(options && options.filters),
    facets: buildFacetsQuery()
  });
}
exports.updatedPackages = updatedPackages;

function popularPackages(res, options) {
  /* jshint camelcase:false */
  sendSearchResults(res, {
    from: options && options.offset,
    size: options && options.perPage,
    query: {
      custom_score: {
        query: buildQuery(options && options.filters),
        script: scoreScript
      }
    },
    facets: buildFacetsQuery()
  });
}
exports.popularPackages = popularPackages;

function searchPackages(res, q, options) {
  /* jshint camelcase:false */
  function filterConstraints(filters) {
    try {
      return buildQuery(filters).bool.must;
    } catch (e) {
      return [];
    }
  }
  sendSearchResults(res, {
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
    facets: buildFacetsQuery()
  });
}
exports.searchPackages = searchPackages;

function dump(cb) {
  /* jshint camelcase:false */
  sendSearchResults({
    json: function(data) {
      if (!data || !data.packages || data.packages.length === 0)
        return cb(new Error("Won't dump an empty database"));
      try {
        cb(null, JSON.stringify(data, null, 2));
      } catch (err) {
        cb(err);
      }
    }
  }, {
    from: 0,
    size: 9999999,
    query: {
      match_all: {}
    },
  });
}
exports.dump = dump;

function dumpToFile(file, cb) {
  dump(function(err, jsonData) {
    if (err)
      return cb(err);
    fs.writeFile(file, jsonData, function(err) {
      if (err)
        return cb(err);
      cb(null, 'Data backuped to ' + file);
    });
  });
}
exports.dumpToFile = dumpToFile;

function backup(cb) {
  var fileName = (new Date())
                  .toISOString()
                  .replace(/( |:|\/)+/g, '-')
                  .split('.')[0] + '.json';
  var backupFile = path.join(BACKUP_DIR, fileName);
  dumpToFile(backupFile, cb);
}
exports.backup = backup;

function indexPackage(pkg, cb) {
  createClient().index(PACKAGES_INDICE, PACKAGE_TYPE, pkg, pkg.slug)
    .on('error', function(err) {
      cb(err);
    })
    .on('data', function(data) {
      cb(null, JSON.parse(data));
    })
    .exec();
}
exports.indexPackage = indexPackage;

function loadFromFile(file, cb) {
  fs.readFile(file, "utf-8", function(err, json) {
    if (err)
      return cb(err);
    try {
      async.map(JSON.parse(json).packages, indexPackage, cb);
    } catch(err) {
      cb(err);
    }
  });
}
exports.loadFromFile = loadFromFile;

function listBackups() {
  return fs.readdirSync(path.join(BACKUP_DIR))
    .filter(function(file) {
      return (/\.json$/).test(file);
    })
    .map(function(backupFile) {
      var backupPath = path.join(BACKUP_DIR, backupFile);
      return {
        name: backupFile,
        path: backupPath,
        length: JSON.parse(fs.readFileSync(backupPath)).packages.length
      };
    })
    .sort(function(b1, b2) {
      return b1 > b2 ? -1 : 1;
    });
}
exports.listBackups = listBackups;

function restore(name, cb) {
  var backup = listBackups().filter(function(backup) {
    return backup.name === name;
  })[0];
  if (!backup)
    return cb(new Error('No backup named ' + name));
  loadFromFile(backup.path, function(err, results) {
    if (err)
      return cb(err);
    cb(null, "Imported " + results.length + " packages from " + name);
  });
}
exports.restore = restore;

function revert(cb) {
  var backups = listBackups();
  if (backups.length === 0)
    return cb(new Error("No JSON backup available in " + BACKUP_DIR));
  var backup = backups[0];
  createClient().deleteIndex(PACKAGES_INDICE)
    .on('error', cb)
    .on('data', function() {
      loadFromFile(backup.path, function(err, data) {
        if (err)
          return cb(err);
        cb(null, "Reimported " + data.length + " packages from " + backup.name);
      });
    })
    .exec();
}
exports.revert = revert;
