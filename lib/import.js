var request = require('request');
var async = require('async');
var text = require('./text');
var GitHubApi = require('github');
var libgithub = require('./github');
var libbitbucket = require('./bitbucket');
var libutil = require('./util');
var GitHubClient = libgithub.GitHubClient;
var ghc;

//var jsonDB = 'https://raw.github.com/wbond/package_control_channel/master/repositories.json';
var jsonDB = 'http://localhost/stpackages/db.json';

function createGitHubClient() {
  var gh = new GitHubApi({version: "3.0.0", timeout: 10000});
  gh.authenticate({
    type: "oauth",
    token: process.env.GITHUB_API_TOKEN
  });
  return (new GitHubClient(gh))
    .on("info", function(message) {
      console.log('[INFO]  %s', message);
    })
    .on("warn", function(error) {
      console.error('[WARN]  %s', [
        error,
        error.defaultMessage,
        error.code
      ].join(' '));
    });
}
exports.createGitHubClient = createGitHubClient;

function loadJSON(url, cb) {
  request(url, function(err, response, body) {
    try {
      cb(err, JSON.parse(body));
    } catch (err) {
      cb(err);
    }
  });
}

function repoType(repoURL) {
  // Note: test order is important
  if (/\.json$/i.test(repoURL))
    return 'json';
  if (libbitbucket.supportedRepoURL(repoURL))
    return 'bitbucket';
  if (libgithub.supportedRepoURL(repoURL))
    return 'github';
  return 'unknown';
}
exports.repoType = repoType;

function packageControlDataToObjects(pcData) {
  /* jshint camelcase:false */
  var nameMap = pcData.package_name_map;

  function toObject(repoURL) {
    var info
      , type = repoType(repoURL)
      , object = {url: repoURL, type: type};
    if (type === "github")
      info = libgithub.extractRepoUrlInfo(repoURL);
    else if (type === "bitbucket")
      info = libbitbucket.extractRepoUrlInfo(repoURL);
    else
      return object;
    if (info) {
      object.name = info.repo in nameMap ? nameMap[info.repo] : info.repo;
      object.slug = text.slugify(object.name);
    }
    return object;
  }

  return pcData.repositories.map(toObject);
}
exports.packageControlDataToObjects = packageControlDataToObjects;

function fetchLocalInfo(data, cb) {
  try {
    cb(null, packageControlDataToObjects(data));
  } catch (err) {
    cb(err);
  }
}

function fetchRemoteInfo(infos, cb) {
  console.log('fetchRemoteInfo', infos);
  async.map(infos, function(info, cb) {
    if (!info || info.type !== "github") // XXX support other types
      return cb(null, info);
    ghc.getRepoInfo(info.url, function(err, remoteInfo) {
      if (err || !remoteInfo)
        return cb(null, info); // just skip the operation
      cb(null, libutil.extend(info, remoteInfo));
    });
  }, cb);
}

function fetchReadme(infos, cb) {
  async.map(infos, function(info, cb) {
    if (!info || info.type !== "github") // XXX support other types
      return cb(null, info);
    ghc.getReadme(info.url, function(err, readme) {
      if (err || !readme)
        return cb(null, info); // just skip the operation
      info.readme = readme;
      cb(null, info);
    });
  }, cb);
}

function run(cb) {
  ghc = createGitHubClient();
  async.waterfall([
    loadJSON.bind(null, jsonDB),
    fetchLocalInfo,
    fetchRemoteInfo,
    fetchReadme
  ], cb);
}
exports.run = run;
