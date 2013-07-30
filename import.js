var importer = require('./lib/import');

var jsonDB = 'https://raw.github.com/wbond/package_control_channel/master/repositories.json';

importer.run(jsonDB, function(err) {
  if (err)
    return console.error('[FAIL]  ' + err);
});
