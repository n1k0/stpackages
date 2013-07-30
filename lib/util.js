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

function range(N) {
  return Array.apply(0, Array(N)).map(function(x, y) {
    return y;
  });
}
exports.range = range;
