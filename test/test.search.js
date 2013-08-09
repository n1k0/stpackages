/* jshint camelcase:false */
/* global describe, it, beforeEach, afterEach */
//var async = require('async');
var path = require('path');
var expect = require('chai').expect;
var sinon = require('sinon');
var SearchIndex = require('../lib/search').SearchIndex;

describe("SearchIndex", function() {
  var index, sandbox;

  beforeEach(function(done) {
    sandbox = sinon.sandbox.create();
    index = new SearchIndex({
      backupDir: "/backups",
      indice: "stpackages-test"
    });
    index.dropAll(function() {
      var fixtures = path.join(__dirname, 'fixtures', 'fixtures.json');
      index.loadFromFile(fixtures, done);
    });
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe("#backup", function() {
    it("should dump data to target file", function() {
      sandbox.stub(index, "dumpToFile");
      index.backup();
      sinon.assert.calledOnce(index.dumpToFile);
      sinon.assert.calledWithMatch(index.dumpToFile, /\.json$/);
    });
  });

  describe("#dump", function() {
    it("should dump existing index data", function(done) {
      index.dump(function(err, data) {
        expect(JSON.parse(data).total).eql(2);
        done();
      });
    });
  });

  describe("#dumpToFile", function() {
    it("should retrieve a dump of existing index data", function() {
      sinon.stub(index, "dump");
      index.dumpToFile("foo.json");
      sinon.assert.calledOnce(index.dump);
    });

    it("should dump existing index data to file", function(done) {
      var fs = require("fs");
      sinon.stub(fs, "writeFile", function(f, d, cb) {
        cb();
      });
      index.dumpToFile("foo.json", function(){
        sinon.assert.calledOnce(fs.writeFile);
        sinon.assert.calledWith(fs.writeFile, "foo.json");
        done();
      });
    });
  });

  describe("#getPackage", function() {
    it("should retrieve an existing package", function(done) {
      index.getPackage("pkg2", function(err, pkg) {
        expect(err).to.be.a("null");
        expect(pkg.name).to.equal("Package 2");
        expect(pkg.nbStargazers).to.equal(43);
        done();
      });
    });

    it("should not retrieve a nonexistent package", function(done) {
      index.getPackage("pkg99", function(err, pkg) {
        expect(err).to.be.a("null");
        expect(pkg).to.be.a("undefined");
        done();
      });
    });
  });

  describe("#getPackages", function() {
    it("should search for packages", function(done) {
      index.getPackages({query: {match_all: {}}}, function(err, results) {
        expect(results.packages).to.have.length.of(2);
        done();
      });
    });
  });

  describe("#getRecentPackages", function() {
    it("should retrieve recent packages", function(done) {
      index.getRecentPackages({}, function(err, results) {
        if (err) throw err;
        expect(results.total).eql(2);
        expect(results.packages).to.have.length.of(2);
        expect(results.packages[0].createdAt).eql("2013-02-01T00:00:00Z");
        expect(results.packages[1].createdAt).eql("2013-01-01T00:00:00Z");
        done();
      });
    });

    it("should paginate recent packages", function(done) {
      index.getRecentPackages({offset: 1, perPage: 1}, function(err, results) {
        if (err) throw err;
        expect(results.total).eql(2);
        expect(results.packages).to.have.length.of(1);
        expect(results.packages[0].createdAt).eql("2013-01-01T00:00:00Z");
        done();
      });
    });
  });

  describe("#getPopularPackages", function() {
    it("should retrieve popular packages", function(done) {
      index.getPopularPackages({}, function(err, results) {
        if (err) throw err;
        expect(results.total).eql(2);
        expect(results.packages).to.have.length.of(2);
        expect(results.packages[0].nbStargazers).eql(43);
        expect(results.packages[1].nbStargazers).eql(42);
        done();
      });
    });

    it("should paginate popular packages", function(done) {
      index.getPopularPackages({offset: 1, perPage: 1}, function(err, results) {
        if (err) throw err;
        expect(results.total).eql(2);
        expect(results.packages).to.have.length.of(1);
        expect(results.packages[0].nbStargazers).eql(42);
        done();
      });
    });
  });

  describe("#getUpdatedPackages", function() {
    it("should retrieve updated packages", function(done) {
      index.getUpdatedPackages({}, function(err, results) {
        if (err) throw err;
        expect(results.total).eql(2);
        expect(results.packages).to.have.length.of(2);
        expect(results.packages[0].updatedAt).eql("2013-03-01T00:00:00Z");
        expect(results.packages[1].updatedAt).eql("2013-02-01T00:00:00Z");
        done();
      });
    });

    it("should paginate updated packages", function(done) {
      index.getUpdatedPackages({offset: 1, perPage: 1}, function(err, results) {
        if (err) throw err;
        expect(results.total).eql(2);
        expect(results.packages).to.have.length.of(1);
        expect(results.packages[0].updatedAt).eql("2013-02-01T00:00:00Z");
        done();
      });
    });
  });

  describe("#indexPackage", function() {
    it("should index a new package", function(done) {
      index.indexPackage({slug: "plop"}, function(err, res) {
        expect(err).to.be.a("null");
        expect(res.ok).eql(true);
        expect(res._id).eql("plop");
        done();
      });
    });
  });

  describe("#listBackups", function() {
    it("should list ordered backups", function() {
      var fs = require("fs");
      sandbox.stub(fs, "readdirSync", function() {
        return ["2.json", "1.json", "3.json"];
      });
      sandbox.stub(fs, "readFileSync").returns('{"packages": []}');
      expect(index.listBackups().map(function(backup) {
        return backup.path;
      })).to.deep.equal([
        "/backups/3.json",
        "/backups/2.json",
        "/backups/1.json"
      ]);
    });

    it("should include data stats about packages", function() {
      var fs = require("fs");
      sandbox.stub(fs, "readdirSync", function() {
        return ["2.json", "1.json", "3.json"];
      });
      sandbox.stub(fs, "readFileSync").returns('{"packages": [1, 2]}');
      expect(index.listBackups().map(function(backup) {
        return backup.length;
      })).to.deep.equal([2, 2, 2]);
    });
  });

  describe("#searchPackages", function() {
    it("should search for packages", function(done) {
      index.searchPackages("foo", {}, function(err, results) {
        expect(err).to.be.a("null");
        expect(results.total).eql(1);
        expect(results.packages[0].description).eql("foo");
        done();
      });
    });

    it("should paginate results", function(done) {
      index.searchPackages("package", {
        offset: 0,
        perPage: 1
      }, function(err, results) {
        if (err) throw err;
        expect(err).to.be.a("null");
        expect(results.total).eql(2);
        expect(results.packages).to.have.length.of(1);
        done();
      });
    });
  });

  describe("#updatePackage", function() {
    it("should update an existing package", function(done) {
      index.updatePackage("pkg1", {name: "updated"}, function(err, res) {
        expect(err).to.be.a("null");
        expect(res.ok).eql(true);
        index.getPackage("pkg1", function(err, pkg) {
          expect(err).to.be.a("null");
          expect(pkg.name).to.equal("updated");
          expect(pkg.nbStargazers).to.equal(42);
          done();
        });
      });
    });
  });
});
