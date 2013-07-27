/* jshint camelcase:false */
/* global describe, it, beforeEach, afterEach */
var expect = require('chai').expect;
//var sinon = require('sinon');
var path = require('path');
var db = require('../lib/db');
var testDataDir = path.join(__dirname, 'data');

describe("Database", function() {
  describe("load", function() {
    it("should load a database from a data directory", function(done) {
      db.load(testDataDir, function(err, db) {
        expect(db).to.have.length.of(1);
        done();
      });
    });
  });

  describe("findBySlug", function() {
    var packages;

    beforeEach(function() {
      packages = [{slug: "pkga"}, {slug: "pkgb"}];
    });

    it("should find a package by its slug", function() {
      expect(db.findBySlug(packages, "pkgb")).to.be.a("object");
    });

    it("should throw if package is not found", function() {
      expect(function() {
        return db.findBySlug(packages, "xxx");
      }).Throw(Error);
    });
  });
});
