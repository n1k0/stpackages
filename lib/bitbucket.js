var REPO_REGEX = /bitbucket\.org\/([a-z-A-Z0-9-_\.]+)\/([a-z-A-Z0-9-_\.]+)/;
exports.REPO_REGEX = REPO_REGEX;

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
