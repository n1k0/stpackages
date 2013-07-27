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

    it("should fail if data directory is invalid", function(done) {
      db.load("xxx", function(err) {
        expect(err).to.be.an.instanceOf(Error);
        done();
      });
    });
  });

  describe("PackageQuery", function() {
    describe("constructor", function() {
      var query = new db.PackageQuery([]);
      expect(query.packages).to.deep.equal([]);
    });

    describe("filter", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([
          {slug: "pkga", foo: "bar", bar: 42},
          {slug: "pkgb", foo: "baz", bar: 42},
          {slug: "pkgc", foo: "bazinga", bar: 43}
        ]);
      });

      it("should filter records matching a single constraint", function() {
        query.filter({foo: "bar"});
        expect(query).to.have.length.of(1);
        expect(query.at(0).slug).to.equal("pkga");
      });

      it("should filter records matching multiple constraints", function() {
        query.filter({foo: "baz"});
        expect(query).to.have.length.of(1);
        expect(query.at(0).slug).to.equal("pkgb");
      });
    });

    describe("order", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([
          {slug: "pkga", foo: "bar", bar: 3},
          {slug: "pkgb", foo: "baz", bar: 1},
          {slug: "pkgc", foo: "bazinga", bar: 2}
        ]);
      });

      it("should order records by ascending values", function() {
        var values = query.order("bar").all().map(function(record) {
          return record.bar;
        });
        expect(values).to.deep.equal([1, 2, 3]);
      });

      it("should order records by descending values", function() {
        var values = query.order("bar", "desc").all().map(function(record) {
          return record.bar;
        });
        expect(values).to.deep.equal([3, 2, 1]);
      });
    });

    describe("findOneBySlug", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([{slug: "pkga"}, {slug: "pkgb"}]);
      });

      it("should find a package by its slug", function() {
        var pkg = query.findOneBySlug("pkgb");
        expect(pkg).to.be.a("object");
        expect(pkg.slug).to.equal("pkgb");
      });

      it("should throw if package is not found", function() {
        expect(function() {
          return query.findOneBySlug("xxx");
        }).Throw(Error);
      });
    });
  });
});
