var express = require('express');
var http = require('http');
var path = require('path');
var db = require('./lib/db');
var libsearch = require('./lib/search');
var app = express();

var dataDir = path.join(__dirname, 'data');

app.use(express.static(__dirname + '/static'));
app.use(app.router);

app.set('per page', ~~process.env.MAX_PER_PAGE || 12);
app.set('json spaces', 2);

var scoreScript = "_score * doc['nbStargazers'].value * doc['nbForks'].value " +
                  " / (doc['nbIssues'].value + 1) * doc['popularity'].value";

function createQuery(data) {
  return new db.PackageQuery(data || app.get('data'));
}

app.get('/api/recent', function(req, res) {
  /* jshint camelcase:false */
  libsearch.sendSearchResults(res, {
    from: ~~(req.query.offset || 0),
    size: app.get('per page'),
    sort: [{createdAt: "desc"}],
    query: {match_all: {}}
  });
});

app.get('/api/updated', function(req, res) {
  /* jshint camelcase:false */
  libsearch.sendSearchResults(res, {
    from: ~~(req.query.offset || 0),
    size: app.get('per page'),
    sort: [{updatedAt: "desc"}],
    query: {match_all: {}}
  });
});

app.get('/api/popular', function(req, res) {
  /* jshint camelcase:false */
  libsearch.sendSearchResults(res, {
    from: ~~(req.query.offset || 0),
    size: app.get('per page'),
    //sort: [{popularity: "desc"}],
    query: {
      custom_score: {
        query: {match_all: {}},
        script: scoreScript
      }
    }
  });
});

app.get('/api/search', function(req, res) {
  /* jshint camelcase:false */
  libsearch.sendSearchResults(res, {
    from: ~~(req.query.offset || 0),
    size: app.get('per page'),
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
            query : req.query.q,
            use_dis_max : false
          }
        },
        script: scoreScript
      }
    }
  });
});

app.get('/api/details/:slug', function(req, res) {
  res.send(createQuery().findFirstBySlug(req.params.slug));
});

app.start = function() {
  this._server = http.createServer(this);
  this._server.listen(process.env.NODE_PORT || 3000);
};

app.close = function(cb) {
  this._server.close(cb);
};

db.load(dataDir, function(err, data) {
  if (err)
    return console.error("Couldn't load database: " + err);
  app.set('data', data);
  app.start();
});

exports.app = app;
