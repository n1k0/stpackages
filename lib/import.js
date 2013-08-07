var async = require('async');
var fs = require('fs');
var path = require('path');
var text = require('./text');
var GitHubApi = require('github');
var libgithub = require('./github');
var libbitbucket = require('./bitbucket');
var libutil = require('./util');
var libsearch = require('./search');
var printer = require('./printer');
var GitHubClient = libgithub.GitHubClient;
var dataDir = path.join(__dirname, '..', 'data');
var ghc;

function check() {
  if (!process.env.GITHUB_API_TOKEN)
    throw new Error('GITHUB_API_TOKEN is missing');
}

function createGitHubClient() {
  var gh = new GitHubApi({version: "3.0.0", timeout: 10000});
  gh.authenticate({
    type: "oauth",
    token: process.env.GITHUB_API_TOKEN
  });
  return (new GitHubClient(gh))
    .on("info", printer.info)
    .on("warn", printer.warn);
}
exports.createGitHubClient = createGitHubClient;

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
      return repo && ["json", "github"].indexOf(repo.type) !== -1; // XXX support bitbucket
    });
    cb(null, repos);
  } catch (err) {
    cb(err);
  }
}

function flattenJSONRepoInfo(info) {
  function platform(platforms) {
    if (!platforms || platforms["*"])
      return ["windows", "linux", "osx"];
    return Object.keys(info.platforms);
  }
  return {
    type: repoType(info.homepage),
    name: info.name,
    slug: text.slugify(info.name),
    url: info.homepage,
    description: info.description,
    author: info.author,
    homepage: info.homepage,
    platforms: platform(info.platforms)
  };
}

function fetchJSONinfo(repos, cb) {
  var jsonRepos = [];
  async.mapLimit(repos, 5, function(repo, cb) {
    if (repo.type !== "json")
      return cb(null, repo);
    printer.info('Fetching JSON packages info from ' + repo.url);
    libutil.loadJSON(repo.url, function(err, json) {
      if (err) return cb(null, repo); // just skip it
      jsonRepos = jsonRepos.concat(json.packages.map(flattenJSONRepoInfo));
      cb(null, repo);
    });
  }, function(err, repos) {
    cb(err, repos.concat(jsonRepos));
  });
}

function fetchRemoteInfo(repo, cb) {
  if (repo.type !== "github") // XXX: handle bitbucket
    return cb(null, repo);
  ghc.getRepoInfo(repo.url, function(err, remoteInfo) {
    if (err || !remoteInfo)
      return cb(null, repo); // just skip the operation
    cb(null, libutil.extend(repo, remoteInfo));
  });
}

function fetchReadme(repo, cb) {
  if (repo.type !== "github") // XXX: handle bitbucket
    return cb(null, repo);
  ghc.getReadme(repo.url, function(err, readme) {
    if (err || !readme)
      return cb(null, repo); // just skip the operation
    repo.readme = readme;
    cb(null, repo);
  });
}

function savePackage(repo, cb) {
  libsearch.updatePackage(repo, function(err, data) {
    if (err)
      return cb(err);
    cb(null, repo);
  });
}

function processRepos(repos, cb) {
  async.eachLimit(repos, 5, function(repo, cb) {
    async.waterfall([
      fetchRemoteInfo.bind(null, repo),
      fetchReadme,
      savePackage
    ], cb);
  }, cb);
}

function run(jsonDB, cb) {
  check();
  ghc = createGitHubClient();
  async.waterfall([
    libutil.loadJSON.bind(null, jsonDB),
    fetchBaseInfo,
    fetchJSONinfo,
    processRepos
  ], cb);
}
exports.run = run;
