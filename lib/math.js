function daysdiff(datea, dateb) {
  return Math.round((datea - dateb) / 1000 / 60 / 60 / 24);
}

function popularity(pkg) {
  var age = daysdiff(new Date(), new Date(pkg.createdAt));
  var idleness = daysdiff(new Date(), new Date(pkg.updatedAt));
  return (pkg.nbStargazers + (pkg.nbForks * 2) - (pkg.nbIssues * 3)) / (age + idleness);
}
exports.popularity = popularity;
