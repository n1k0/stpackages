var db = require('./lib/db');
var path = require('path');
var libsearch = require('./lib/search');

var dataDir = path.join(__dirname, 'data');

db.load(dataDir, function(err, data) {
  if (err)
    throw err;
  var client = libsearch.createClient();
  data.forEach(function(pkg) {
    client.index("stpackages", "package", pkg)
      .on('data', function() {
        console.log('indexed ' + pkg.name);
      })
      .on('error', function(err) {
        console.error('error: ' + err);
      })
      .exec();
  });
});
