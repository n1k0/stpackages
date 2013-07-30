var express = require('express');
var http = require('http');
var path = require('path');
var db = require('./lib/db');
var app = express();

var dataDir = path.join(__dirname, 'data');

app.use(express.static(__dirname + '/static'));
app.use(app.router);

app.set('per page', ~~process.env.MAX_PER_PAGE || 12);
app.set('json spaces', 2);

function createQuery(data) {
  return new db.PackageQuery(data || app.get('data'));
}

app.get('/api/recent', function(req, res) {
  var offset = ~~(req.query.offset || 0);
  res.json(createQuery().getRecent(offset, app.get('per page')));
});

app.get('/api/updated', function(req, res) {
  var offset = ~~(req.query.offset || 0);
  res.json(createQuery().getUpdated(offset, app.get('per page')));
});

app.get('/api/popular', function(req, res) {
  var offset = ~~(req.query.offset || 0);
  res.json(createQuery().getPopular(offset, app.get('per page')));
});

app.get('/api/search', function(req, res) {
  require('./lib/search').search(req.query.q, {
    offset: ~~req.query.offset || 0,
    perPage: app.get('per page')
  }, function(err, results, total) {
    if (err)
      return res.json(500, err);
    res.json({
      packages: results,
      total: total
    });
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
