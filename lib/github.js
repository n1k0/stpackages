var events = require("events");
var util = require("util");

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

GitHubClient.prototype.getRepoInfo = function(repoURL, cb) {
  this.emit("info", "processing " + repoURL);

  var urlInfo = extractRepoUrlInfo(repoURL);
  if (!urlInfo)
    throw new Error("couldn't extract user/repo from " + repoURL);

  this.client.repos.get(urlInfo, function(err, data) {
    if (err)
      return cb(err);
    try {
      cb(null, formatRepoInfo(repoURL, data));
    } catch (err) {
      err.message = "Couldn't format repo data for " + repoURL + ": " + err;
      cb(err);
    }
  });
};
