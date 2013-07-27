var importer = require('./lib/import');

//var jsonDB = 'https://raw.github.com/wbond/package_control_channel/master/repositories.json';
var jsonDB = 'http://localhost/stpackages/db.json';

importer.run(jsonDB, function(err) {
  if (err)
    return console.error('Import error: ' + err);
});
