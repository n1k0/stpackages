var request = require('request');
var async = require('async');
var fs = require('fs');
var path = require('path');
var text = require('./text');
var GitHubApi = require('github');
var libgithub = require('./github');
var libbitbucket = require('./bitbucket');
var libutil = require('./util');
var GitHubClient = libgithub.GitHubClient;
var dataDir = path.join(__dirname, '..', 'data');
var ghc;

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

function fetchBaseInfo(data, cb) {
  try {
    var repos = packageControlDataToObjects(data).filter(function(repo) {
      return repo && repo.type === "github"; // XXX support other types
    });
    cb(null, repos);
  } catch (err) {
    cb(err);
  }
}

function fetchRemoteInfo(repo, cb) {
  ghc.getRepoInfo(repo.url, function(err, remoteInfo) {
    if (err || !remoteInfo)
      return cb(null, repo); // just skip the operation
    cb(null, libutil.extend(repo, remoteInfo));
  });
}

function fetchReadme(repo, cb) {
  ghc.getReadme(repo.url, function(err, readme) {
    if (err || !readme)
      return cb(null, repo); // just skip the operation
    repo.readme = readme;
    cb(null, repo);
  });
}

function writeFile(repo, cb) {
  if (!repo || repo.type !== "github") // XXX support other types
    return cb(null);
  var filePath = path.join(dataDir, repo.slug + '.json');
  fs.writeFile(filePath, JSON.stringify(repo, null, 2), function(err) {
    if (err) return cb(err);
    console.log('Written ' + filePath + ' from ' + repo.url);
    cb(null, filePath);
  });
}

function processRepos(repos, cb) {
  async.each(repos, function(repo, cb) {
    async.waterfall([
      fetchRemoteInfo.bind(null, repo),
      fetchReadme,
      writeFile
    ], cb);
  }, cb);
}

function run(jsonDB, cb) {
  ghc = createGitHubClient();
  async.waterfall([
    loadJSON.bind(null, jsonDB),
    fetchBaseInfo,
    processRepos
  ], cb);
}
exports.run = run;
