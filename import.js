var importer = require('./lib/import');

importer.run(function(err, packages) {
  if (err)
    throw err;
  console.log(packages);
});
