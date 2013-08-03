var async = require('async');
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
      async.mapLimit(data, 15, function(pkg, cb) {
        client.index("stpackages", "package", pkg, pkg.slug)
          .on('error', onError)
          .on('data', function(data) {
            console.log('indexed ' + pkg.name, data);
            cb(null, pkg.name);
          })
          .exec();
      }, function(err, results) {
        if (err)
          console.error(err);
        console.log(results.length + ' packages indexed.');
      });
    })
    .exec();
});
