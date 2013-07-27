/* jshint camelcase:false */
/* global describe, it, beforeEach */
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

    describe("toJSON", function() {
      it("should return current collection as JSON", function() {
        var query = new db.PackageQuery([]);
        expect(query.toJSON()).to.equal("[]");
      });
    });

    describe("filter", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([
          {slug: "pkga", foo: "bar", tags: ["a"]},
          {slug: "pkgb", foo: "baz", tags: ["a", "b"]},
          {slug: "pkgc", foo: "bazinga", tags: ["b"]}
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

      it("should filter records against an array property", function() {
        query.filter({tags: "a"});
        expect(query).to.have.length.of(2);
        expect(query.at(0).slug).to.equal("pkga");
        expect(query.at(1).slug).to.equal("pkgb");
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

      it("should keep existing order when nonexistent property", function() {
        var values = query.order("xxx").all().map(function(record) {
          return record.bar;
        });
        expect(values).to.deep.equal([3, 1, 2]);
      });
    });

    describe("limit", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([
          {slug: "pkga"},
          {slug: "pkgb"},
          {slug: "pkgc"}
        ]);
      });

      it("should limit collection length to max value", function() {
        expect(query.limit(2)).to.have.length.of(2);
        expect(query.at(0).slug).to.equal("pkga");
        expect(query.at(1).slug).to.equal("pkgb");
      });

      it("should limit collection offset to start & max values", function() {
        expect(query.limit(1, 1)).to.have.length.of(1);
        expect(query.at(0).slug).to.equal("pkgb");
      });
    });

    describe("findFirstBySlug", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([{slug: "pkga"}, {slug: "pkgb"}]);
      });

      it("should find a package by its slug", function() {
        var pkg = query.findFirstBySlug("pkgb");
        expect(pkg).to.be.a("object");
        expect(pkg.slug).to.equal("pkgb");
      });

      it("should throw if package is not found", function() {
        expect(function() {
          return query.findFirstBySlug("xxx");
        }).Throw(Error);
      });
    });

    describe("findByTag", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([
          {slug: "pkga", tags: ["a", "b", "c"]},
          {slug: "pkgb", tags: ["a", "c"]},
          {slug: "pkgc", tags: ["c"]}
        ]);
      });

      it("should find tagged records (a)", function() {
        query.findByTag("a");
        expect(query).to.have.length.of(2);
        expect(query.at(0).slug).to.equal("pkga");
        expect(query.at(1).slug).to.equal("pkgb");
      });

      it("should find tagged records (b)", function() {
        query.findByTag("b");
        expect(query).to.have.length.of(1);
      });

      it("should find tagged records (c)", function() {
        query.findByTag("c");
        expect(query).to.have.length.of(3);
      });
    });

    describe("Chaining methods", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery([
          {slug: "pkga", nb: 3, tags: ["a", "b", "c"]},
          {slug: "pkgb", nb: 1, tags: ["a", "c"]},
          {slug: "pkgc", nb: 2, tags: ["c"]},
          {slug: "pkgd", nb: 0, tags: ["d"]}
        ]);
      });

      it("should allow chaining", function() {
        query.filter({tags: "c"}).order("nb", "desc");
        expect(query).to.have.length.of(3);
        expect(query.all().map(function(record) {
          return record.slug;
        })).to.deep.equal(["pkga", "pkgc", "pkgb"]);
      });
    });
  });
});
