var db = require('./lib/db');
var si = require('search-index');
var path = require('path');

var dataDir = path.join(__dirname, 'data');

function createIndexData(data) {
  var indexData = {};
  data.forEach(function(repo) {
    var newRepo = {};
    for (var i in repo) {
      try {
        newRepo[i] = (repo[i]).toString();
      } catch (err) {
        newRepo[i] = repo[i] || "";
      }
    }
    indexData[repo.slug] = newRepo;
  });
  return JSON.stringify(indexData);
}

var filters = [];

db.load(dataDir, function(err, data) {
  si.index(createIndexData(data), "packages", filters, console.log);
});
