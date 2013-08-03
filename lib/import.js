var request = require('request');
var async = require('async');
var fs = require('fs');
var path = require('path');
var text = require('./text');
var GitHubApi = require('github');
var libgithub = require('./github');
var libbitbucket = require('./bitbucket');
var libutil = require('./util');
var stcompat = require('./stcompat');
var GitHubClient = libgithub.GitHubClient;
var dataDir = path.join(__dirname, '..', 'data');
var ghc;
var compatData;

function info() {
  console.log.apply(console, ['[INFO]'].concat([].slice.call(arguments)));
}

function skip() {
  console.info.apply(console, ['[SKIP]'].concat([].slice.call(arguments)));
}

function warn() {
  console.warn.apply(console, ['[WARN]'].concat([].slice.call(arguments)));
}

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
    .on("info", info)
    .on("warn", warn);
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
    info('Fetching JSON packages info from ' + repo.url);
    loadJSON(repo.url, function(err, json) {
      if (err) return cb(null, repo); // just skip it
      jsonRepos = jsonRepos.concat(json.packages.map(flattenJSONRepoInfo));
      cb(null, repo);
    });
  }, function(err, repos) {
    cb(err, repos.concat(jsonRepos));
  });
}

function excludeExisting(repos, cb) {
  async.reject(repos, function(repo, cb) {
    fs.exists(path.join(dataDir, repo.slug + '.json'), function(exists) {
      if (exists)
        skip('' + repo.url + ' already exists');
      cb(exists);
    });
  }, cb.bind(null, null));
}

function addCompatData(repos, cb) {
  try {
    cb(null, repos.map(function(repo) {
      repo.st3compat = repo.url in compatData ? compatData[repo.url] : 'Unknown';
      return repo;
    }));
  } catch (err) {
    return cb(err);
  }
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

function writeFile(repo, cb) {
  if (!repo || repo.type !== "github") // XXX support other types
    return cb(null);
  var filePath = path.join(dataDir, repo.slug + '.json');
  fs.writeFile(filePath, JSON.stringify(repo, null, 2), function(err) {
    if (err) return cb(err);
    info('Written ' + filePath + ' from ' + repo.url);
    cb(null, repo);
  });
}

function processRepos(repos, cb) {
  async.eachLimit(repos, 5, function(repo, cb) {
    async.waterfall([
      fetchRemoteInfo.bind(null, repo),
      fetchReadme,
      writeFile
    ], cb);
  }, cb);
}

function run(jsonDB, cb) {
  check();
  stcompat.getCompatData(function(err, data) {
    if (err)
      console.error('[WARN]  Unable to load compat data: ' + err);
    compatData = data || {};
    ghc = createGitHubClient();
    async.waterfall([
      loadJSON.bind(null, jsonDB),
      fetchBaseInfo,
      fetchJSONinfo,
      addCompatData,
      excludeExisting,
      processRepos
    ], cb);
  });
}
exports.run = run;
