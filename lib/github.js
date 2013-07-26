var events = require("events");
var util = require("util");
var libutil = require("./util");

var REPO_REGEX = /github\.com\/([a-z-A-Z0-9-_\.]+)\/([a-z-A-Z0-9-_\.]+)/;
exports.REPO_REGEX = REPO_REGEX;

function formatRepoInfo(repoURL, data) {
  /* jshint camelcase:false */
  return {
    author: data.owner.login,
    homepage: repoURL,
    description: data.description,
    website: data.homepage || undefined,
    updatedAt: data.pushed_at,
    nbIssues: data.open_issues_count,
    nbStargazers: data.watchers_count
  };
}

function supportedRepoURL(repoURL) {
  return REPO_REGEX.test(repoURL);
}
exports.supportedRepoURL = supportedRepoURL;

function extractRepoUrlInfo(repoURL) {
  var match = REPO_REGEX.exec(repoURL);
  if (match)
    return {user: match[1], repo: match[2]};
}
exports.extractRepoUrlInfo = extractRepoUrlInfo;

function GitHubClient(client) {
  events.EventEmitter.call(this);
  this.client = client;
}
util.inherits(GitHubClient, events.EventEmitter);
exports.GitHubClient = GitHubClient;

GitHubClient.prototype.processError = function(err, cb, message) {
  if (message && err && err.message)
    err.message = message + ": " + err.message;
  this.emit("warn", err);
  return cb(err);
};

GitHubClient.prototype.parseRepoURL = function(repoURL) {
  var urlInfo = extractRepoUrlInfo(repoURL);
  if (!urlInfo)
    throw new Error("Couldn't extract user/repo from " + repoURL);
  return urlInfo;
};

GitHubClient.prototype.getRepoInfo = function(repoURL, cb) {
  this.emit("info", "processing " + repoURL);

  this.client.repos.get(this.parseRepoURL(repoURL), function(err, data) {
    var infoObject;
    if (err)
      return this.processError(err, cb, "Error while processing " + repoURL);
    try {
      infoObject = formatRepoInfo(repoURL, data);
    } catch (err) {
      return this.processError(err, cb, "Couldn't format repo data for " + repoURL);
    }
    cb(null, infoObject);
  }.bind(this));
};

GitHubClient.prototype.getReadme = function(repoURL, cb) {
  this.emit("info", "fetching README for " + repoURL);

  this.client.repos.getReadme(this.parseRepoURL(repoURL), function(err, readme) {
    if (err)
      return this.processError(err, cb, "Couldn't fetch README for " + repoURL);
    cb(null, readme && readme.content ? libutil.btoa(readme.content) : "");
  }.bind(this));
};
