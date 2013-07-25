/**
 * https://raw.github.com/zfkun/sublime-kissy-snippets/master/packages.json
 * https://github.com/luqman/SublimeText2RailsRelatedFiles
 */
var request = require('request');
var async = require('async');
var text = require('./text');
var GitHubApi = require('github');
var libgithub = require('./github');
var libbitbucket = require('./bitbucket');
var GitHubClient = libgithub.GitHubClient;

//var jsonDB = 'https://raw.github.com/wbond/package_control_channel/master/repositories.json';
var jsonDB = 'http://localhost/stpackages/db.json';

var gh = new GitHubApi({version: "3.0.0", timeout: 10000});
gh.authenticate({
  type: "oauth",
  token: process.env.GITHUB_API_TOKEN
});

var ghc = new GitHubClient(gh);

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
  if (/\.json$/i.test(repoURL))
    return 'json';
  if (libbitbucket.supportedRepoURL(repoURL))
    return 'bitbucket';
  if (libgithub.supportedRepoURL(repoURL))
    return 'github';
  return 'unknown';
}

function flattenRepos(data, cb) {
  /* jshint camelcase:false */
  var nameMap = data.package_name_map;

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
    if (info)
      object.name = info.repo in nameMap ? nameMap[info.repo] : info.repo;
      object.slug = text.slugify(object.name);
    return object;
  }

  try {
    cb(null, data.repositories.map(toObject));
  } catch (err) {
    cb(err);
  }
}

function fetchRemoteInfo(infos, cb) {
  async.map(infos, function(info) {
    if (info.type !== "github")
      return;
    console.log("processing " + info.url);
    ghc.getRepoInfo(info.url, function(err, remoteInfo) {
      if (err) {
        // we just want to log what happened
        console.error(err);
        return cb(null, info)
      }
      if (remoteInfo && info && info.name) {
        remoteInfo.name = info.name;
        remoteInfo.slug = info.slug;
      }
      cb(null, remoteInfo);
    });
  }, cb);
}

function run(cb) {
  async.waterfall([
    loadJSON.bind(null, jsonDB),
    flattenRepos,
    fetchRemoteInfo
  ], function(err, packages) {
    if (err)
      return cb(err);
    cb(null, packages);
  });
}
exports.run = run;
