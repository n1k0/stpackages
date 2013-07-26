var importer = require('./lib/import');

//var jsonDB = 'https://raw.github.com/wbond/package_control_channel/master/repositories.json';
var jsonDB = 'http://localhost/stpackages/db-full.json';

importer.run(jsonDB, function(err, packages) {
  if (err)
    throw err;
  console.log(packages);
});
