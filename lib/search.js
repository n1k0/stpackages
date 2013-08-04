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
