var libutil = require('./util');

function parseSecondCompatData(data) {
  /* jshint camelcase:false */
  var compatData = {};
  data.forEach(function(info) {
    var url = info.url.replace(/\.git$/, '')
                      .replace('http://github', 'https://github');
    var status = "unknown";
    if (info.working)
      status = info.extra_steps ? "extra_steps" : "working";
    else if (info.errors)
      status = "errors";
    compatData[url] = status;
  });
  return compatData;
}

function fetchCompatData(cb) {
  var url = "http://www.caniswitchtosublimetext3.com/api/plugins";
  libutil.loadJSON(url, function(err, data) {
    try {
      cb(null, parseSecondCompatData(data));
    } catch (err) {
      cb(err);
    }
  });
}
exports.fetchCompatData = fetchCompatData;
