var express = require('express');
var http = require('http');
var path = require('path');
var db = require('./lib/db');
var libmath = require('./lib/math');
var app = express();

var dataDir = path.join(__dirname, 'data');
var perPage = ~~process.env.MAX_PER_PAGE || 20;

app.use(express.static(__dirname + '/static'));
app.use(app.router);

app.set('json spaces', 2);

function query(data) {
  return new db.PackageQuery(data || app.get('data'));
}

app.get('/api/recent', function(req, res) {
  res.json(query().order('createdAt', 'desc')
                  .except('readme')
                  .limit(perPage)
                  .all());
});

app.get('/api/updated', function(req, res) {
  res.json(query().order('updatedAt', 'desc')
                  .except('readme')
                  .limit(perPage)
                  .all());
});

app.get('/api/popular', function(req, res) {
  res.json(query().virtual("popularity", libmath.popularity)
                  .order('popularity', 'desc')
                  .except('readme', 'popularity')
                  .limit(perPage)
                  .all());
});

app.get('/api/search', function(req, res) {
  require('./lib/search').search(req.query.q, {
    offset: ~~req.query.offset || 0,
    perPage: perPage
  }, function(err, results) {
    if (err)
      return res.json(500, err);
    res.json(results);
  });
});

app.get('/api/details/:slug', function(req, res) {
  res.send(query().findFirstBySlug(req.params.slug));
});

app.start = function() {
  this._server = http.createServer(this);
  this._server.listen(3000);
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
