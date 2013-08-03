var db = require('./lib/db');
var path = require('path');
var libsearch = require('./lib/search');

var dataDir = path.join(__dirname, 'data');

function onError(err) {
  console.error('error: ' + err);
}

db.load(dataDir, function(err, data) {
  if (err)
    throw err;
  var client = libsearch.createClient();
  client.deleteIndex("stpackages")
    .on('error', onError)
    .on('data', function() {
      data.forEach(function(pkg) {
        client.index("stpackages", "package", pkg, pkg.slug)
          .on('error', onError)
          .on('data', function() {
            console.log('indexed ' + pkg.name);
          })
          .exec();
      });
    })
    .exec();
});
