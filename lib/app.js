var express = require('express');
var http = require('http');
var libsearch = require('./search');
var app = express();

app.use(express.static(__dirname + '/../static'));
app.use(app.router);

app.set('per page', ~~process.env.MAX_PER_PAGE || 12);
app.set('json spaces', 2);

var searchIndex = new libsearch.SearchIndex({
  indice: process.env.ELASTIC_SEARCH_INDICE || "stpackages"
});

function sendJsonCb(res) {
  return function(err, results) {
    if (err)
      return res.json(500, err);
    res.send(results);
  };
}

app.get('/api/recent', function(req, res) {
  searchIndex.getRecentPackages({
    offset: ~~req.query.offset,
    perPage: app.get('per page'),
    filters: req.query.filters
  }, sendJsonCb(res));
});

app.get('/api/updated', function(req, res) {
  searchIndex.getUpdatedPackages({
    offset: ~~req.query.offset,
    perPage: app.get('per page'),
    filters: req.query.filters
  }, sendJsonCb(res));
});

app.get('/api/popular', function(req, res) {
  searchIndex.getPopularPackages({
    offset: ~~req.query.offset,
    perPage: app.get('per page'),
    filters: req.query.filters
  }, sendJsonCb(res));
});

app.get('/api/search', function(req, res) {
  searchIndex.searchPackages(req.query.q, {
    offset: ~~req.query.offset,
    perPage: app.get('per page'),
    filters: req.query.filters
  }, sendJsonCb(res));
});

app.get('/api/details/:slug', function(req, res) {
  searchIndex.getPackage(req.params.slug, sendJsonCb(res));
});

app.start = function(port, cb) {
  this._server = http.createServer(this);
  this._server.listen(port);
  if (typeof cb === "function")
    cb();
};

app.close = function(cb) {
  this._server.close(cb || function() {});
};

module.exports = app;
