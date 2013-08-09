var request = require('request');

function btoa(src, enc) {
  return new Buffer(src, 'base64').toString(enc || 'utf-8');
}
exports.btoa = btoa;

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
exports.clone = clone;

function extend(target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source)
      target[prop] = source[prop];
  });
  return target;
}
exports.extend = extend;

function flatten(array) {
  return array.reduce(function(a, b) {
    return a.concat(b);
  });
}
exports.flatten = flatten;

function loadJSON(url, cb) {
  request(url, function(err, response, body) {
    try {
      cb(err, JSON.parse(body));
    } catch (err) {
      cb(err);
    }
  });
}
exports.loadJSON = loadJSON;

function range(N) {
  return Array.apply(0, Array(N)).map(function(x, y) {
    return y;
  });
}
exports.range = range;

function cb(fn, callback) {
  return function(err) {
    if (err)
      return callback(err);
    try {
      callback(null, fn.apply(null, [].slice.call(arguments, 1)));
    } catch (err) {
      callback(err);
    }
  };
}
exports.cb = cb;
