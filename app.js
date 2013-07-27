var express = require('express');
var path = require('path');
var db = require('./lib/db');
var libmath = require('./lib/math');
var app = express();

var dataDir = path.join(__dirname, 'data');
var perPage = ~~process.env.MAX_PER_PAGE || 10;

app.use(express.static(__dirname + '/static'));
app.use(app.router);

function query() {
  return new db.PackageQuery(app.get('data'));
}

app.get('/api/recent', function(req, res) {
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
                  .except('readme')
                  .limit(perPage)
                  .toJSON());
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
