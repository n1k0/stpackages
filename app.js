var express = require('express');
var path = require('path');
var db = require('./lib/db');
var libmath = require('./lib/math');
var libsearch = require('./lib/search');
var app = express();

var dataDir = path.join(__dirname, 'data');
var perPage = ~~process.env.MAX_PER_PAGE || 10;

app.use(express.static(__dirname + '/static'));
app.use(app.router);

function query(data) {
  return new db.PackageQuery(data || app.get('data'));
}

app.get('/api/recent', function(req, res) {
  res.set('Content-Type', 'application/json');
  res.send(query().order('createdAt', 'desc')
                  .except('readme')
                  .limit(perPage)
                  .toJSON());
});

app.get('/api/updated', function(req, res) {
  res.set('Content-Type', 'application/json');
  res.send(query().order('updatedAt', 'desc')
                  .except('readme')
                  .limit(perPage)
                  .toJSON());
});

app.get('/api/popular', function(req, res) {
  res.set('Content-Type', 'application/json');
  res.send(query().virtual("popularity", libmath.popularity)
                  .order('popularity', 'desc')
                  .except('readme', 'popularity')
                  .limit(perPage)
                  .toJSON());
});

app.get('/api/search', function(req, res) {
  res.set('Content-Type', 'application/json');
  libsearch.search(req.query.q, {
    offset: ~~req.query.offset || 0,
    perPage: perPage
  }, function(err, results) {
    if (err) {
      res.status(500);
      return res.send(JSON.stringify(err));
    }
    res.send(results);
  });
});

app.get('/api/details/:slug', function(req, res) {
  res.set('Content-Type', 'application/json');
  res.send(query().findFirstBySlug(req.params.slug));
});

app.start = function() {
  this.listen(3000);
  console.log("app started.");
};

db.load(dataDir, function(err, data) {
  if (err)
    return console.error("Couldn't load database: " + err);
  console.log("data loaded, %d packages available.", data.length);
  app.set('data', data);
  app.start();
});
