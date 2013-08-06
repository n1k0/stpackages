require("colors");

var PREFIXES = {
  success: "[SUCCESS]",
  info:    "[INFO]   ",
  skip:    "[SKIP]   ",
  warn:    "[WARN]   ",
  error:   "[ERROR]  "
};

function toArray(args) {
  return [].slice.call(args);
}

function formatArg(arg) {
  if (!(arg instanceof Error))
    return arg;
  try {
    return [arg.message, 'in', arg.stack.match(/at (.*)\n/)[1]].join(' ');
  } catch(err) {
    return arg;
  }
}

function log(args, type, prefix, prefixColor) {
  type = type || "log";
  prefix = prefixColor ? prefix[prefixColor] : prefix;
  var formatted = toArray(args).map(formatArg);
  console[type].apply(console, [prefix].concat(formatted));
}

function success() {
  log(arguments, "log", PREFIXES.success, "green");
}
exports.success = success;

function info() {
  log(arguments, "log", PREFIXES.info, "blue");
}
exports.info = info;

function skip() {
  log(arguments, "info", PREFIXES.skip, "grey");
}
exports.skip = skip;

function warn() {
  log(arguments, "warn", PREFIXES.warn, "yellow");
}
exports.warn = warn;

function error() {
  log(arguments, "error", PREFIXES.error, "red");
}
exports.error = error;
