function btoa(src, enc) {
  return new Buffer(src, 'base64').toString(enc || 'utf-8');
}
exports.btoa = btoa;

function extend(target) {
  var sources = [].slice.call(arguments, 1);
  sources.forEach(function (source) {
    for (var prop in source)
      target[prop] = source[prop];
  });
  return target;
}
exports.extend = extend;
