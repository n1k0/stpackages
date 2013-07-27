var express = require('express');
var path = require('path');
var db = require('./lib/db');
var app = express();

var dataDir = path.join(__dirname, 'data');

app.use(express.static(__dirname + "/static"));
app.use(app.router);

app.start = function() {
  this.listen(3000);
  console.log("app started.");
};

db.load(dataDir, function(err, data) {
  if (err)
    return console.error("Couldn't load database: " + err);
  console.log("data loaded, %d packages available.", data.length);
  app.set("data", data);
  app.start();
});
