var SearchClient = require('elasticsearchclient');

var scoreScript = "_score * (doc['nbStargazers'].value + 1)";

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
  return {
    total: data.hits.total,
    packages: data.hits.hits.map(function(hit) {
      return hit._source;
    })
  };
}

function sendSearchResults(res, query) {
  createClient()
    .search("stpackages", "package", query)
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
    .get("stpackages", "package", slug)
    .on('data', function(data) {
      res.send(JSON.parse(data)._source);
    })
    .on('error', function(err) {
      res.json(500, err);
    })
    .exec();
}
exports.sendPackage = sendPackage;

function recentPackages(res, options) {
  /* jshint camelcase:false */
  sendSearchResults(res, {
    from: options && options.offset,
    size: options && options.perPage,
    sort: [{createdAt: "desc"}],
    query: {match_all: {}}
  });
}
exports.recentPackages = recentPackages;

function updatedPackages(res, options) {
  /* jshint camelcase:false */
  sendSearchResults(res, {
    from: options && options.offset,
    size: options && options.perPage,
    sort: [{updatedAt: "desc"}],
    query: {match_all: {}}
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
        query: {match_all: {}},
        script: scoreScript
      }
    }
  });
}
exports.popularPackages = popularPackages;

function searchPackages(res, q, offset, perPage) {
  /* jshint camelcase:false */
  sendSearchResults(res, {
    from: ~~offset || 0,
    size: perPage,
    query: {
      custom_score: {
        query: {
          query_string : {
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
        },
        script: scoreScript
      }
    }
  });
}
exports.searchPackages = searchPackages;
