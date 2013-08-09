/* jshint camelcase:false */
var async = require('async');
var text = require('./text');
var GitHubApi = require('github');
var libgithub = require('./github');
var libbitbucket = require('./bitbucket');
var libutil = require('./util');
var libsearch = require('./search');
var printer = require('./printer');
var GitHubClient = libgithub.GitHubClient;
var ghc;

var jsonDB = "https://sublime.wbond.net/repositories.json";
var searchIndex = new libsearch.SearchIndex();

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

function toPackage(info) {
  function platform(platforms) {
    if (!platforms || platforms["*"])
      return ["windows", "linux", "osx"];
    return Object.keys(info.platforms);
  }

  function detectGithub(platforms) {
    if (!platforms)
      return;
    var url;
    Object.keys(platforms).forEach(function(platform) {
      var releases = platforms[platform];
      releases.forEach(function(release) {
        if (!libgithub.supportedRepoURL(release.url))
          return;
        var info = libgithub.extractRepoUrlInfo(release.url);
        url = "https://github.com/" + info.user + "/" + info.repo;
      });
    });
    return url;
  }

  var url = info.homepage;
  if (!libgithub.supportedRepoURL(url))
    url = detectGithub(info.platforms) || info.homepage;

  return {
    type: repoType(url),
    name: info.name,
    slug: text.slugify(info.name),
    url: url,
    description: info.description,
    author: info.author,
    homepage: info.homepage,
    platforms: platform(info.platforms)
  };
}

function loadRawPackageData(cb) {
  libutil.loadJSON(jsonDB, libutil.cb(function(data) {
    return libutil.flatten(Object.keys(data.packages).map(function(url) {
      return data.packages[url];
    })).map(toPackage);
  }, cb));
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

function indexPackage(repo, cb) {
  searchIndex.updatePackage(repo.slug, repo, function(err) {
    if (err)
      return cb(null);
    cb(null, repo);
  });
}

function processRepos(repos, cb) {
  async.eachLimit(repos, 5, function(repo, cb) {
    async.waterfall([
      fetchRemoteInfo.bind(null, repo),
      fetchReadme,
      indexPackage
    ], cb);
  }, cb);
}

function run(cb) {
  check();
  ghc = createGitHubClient();
  async.waterfall([
    loadRawPackageData,
    processRepos
  ], cb);
}
exports.run = run;
