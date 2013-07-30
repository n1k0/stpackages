var importer = require('./lib/import');

var defaultJSONDB = 'https://raw.github.com/wbond/package_control_channel/master/repositories.json';
var jsonDB = process.env.PACKAGE_CONTROL_DB_URL || defaultJSONDB;

importer.run(jsonDB, function(err) {
  if (err) {
    console.error('[FAIL]  ' + err);
    throw err;
  }
  console.log('[DONE]  Import complete.');
});
