var si = require('search-index');

function buildQuery(q, options) {
  return {
    query: ("" + q).split(' ').map(function(term) {
      return term.toLowerCase();
    }),
    searchFields: ["name", "slug", "description", "readme"],
    facets: [], // XXX: st compat
    offset: ~~(options && options.offset),
    pageSize: ~~(options && options.perPage),
    weight: {
      name:        [10],
      slug:        [8],
      description: [5],
      readme:      [8]
    }
  };
}

function buildResults(results, cb) {
  cb(null, results.hits.map(function(result) {
    try {
      delete result.document.id;
      result.document.nbIssues = ~~result.document.nbIssues;
      result.document.nbStargazers = ~~result.document.nbStargazers;
      result.document.nbForks = ~~result.document.nbForks;
      return result.document;
    } catch (err) {
      cb(err);
    }
  }));
}

function search(q, options, cb) {
  si.search(buildQuery(q, options), function(results) {
    buildResults(results, function(err, results) {
      cb(err, results);
    });
  });
}
exports.search = search;
