var express = require('express');
var http = require('http');
var libsearch = require('./lib/search');
var app = express();

app.use(express.static(__dirname + '/static'));
app.use(app.router);

app.set('per page', ~~process.env.MAX_PER_PAGE || 12);
app.set('json spaces', 2);

app.get('/api/recent', function(req, res) {
  libsearch.recentPackages(res, {
    offset: ~~(req.query.offset || 0),
    perPage: app.get('per page')
  });
});

app.get('/api/updated', function(req, res) {
  libsearch.updatedPackages(res, {
    offset: ~~(req.query.offset || 0),
    perPage: app.get('per page')
  });
});

app.get('/api/popular', function(req, res) {
  libsearch.popularPackages(res, {
    offset: ~~(req.query.offset || 0),
    perPage: app.get('per page')
  });
});

app.get('/api/search', function(req, res) {
  libsearch.searchPackages(res, req.query.q, {
    offset: ~~(req.query.offset || 0),
    perPage: app.get('per page')
  });
});

app.get('/api/details/:slug', function(req, res) {
  libsearch.sendPackage(res, req.params.slug);
});

app.start = function() {
  this._server = http.createServer(this);
  this._server.listen(process.env.NODE_PORT || 3000);
};

app.close = function(cb) {
  this._server.close(cb);
};

app.start();

exports.app = app;
