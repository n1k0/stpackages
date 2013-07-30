/* jshint camelcase:false */
/* global describe, it, beforeEach */
var expect = require('chai').expect;
//var sinon = require('sinon');
var path = require('path');
var db = require('../lib/db');
var range = require('../lib/util').range;
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

  describe("ArrayQuery", function() {
    describe("#constructor", function() {
      it("should accept initial data", function() {
        var query1 = new db.ArrayQuery([]);
        expect(query1).to.have.length.of(0);

        var query2 = new db.ArrayQuery([1, 2]);
        expect(query2).to.have.length.of(2);
      });

      it("should copy initial data locally", function() {
        var data = [{a: 1}, {b: 2}];
        var query = new db.ArrayQuery(data);
        data.push({c: 3});
        expect(query).to.have.length.of(2);
        expect(query.all()).to.deep.equal(data.slice(0, 2));
      });
    });

    describe("#toJSON", function() {
      it("should return current collection as JSON", function() {
        var query = new db.ArrayQuery([]);
        expect(query.toJSON()).to.equal("[]");
      });
    });

    describe("#filter", function() {
      var query;

      beforeEach(function() {
        query = new db.ArrayQuery([
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

    describe("#order", function() {
      var query;

      beforeEach(function() {
        query = new db.ArrayQuery([
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

    describe("#limit", function() {
      var query;

      beforeEach(function() {
        query = new db.ArrayQuery(range(10).map(function(x) {
          return {slug: "p" + ++x};
        }));
      });

      it("should limit collection length to max value (a)", function() {
        expect(query.limit(2)).to.have.length.of(2);
        expect(query.at(0).slug).to.equal("p1");
        expect(query.at(1).slug).to.equal("p2");
      });

      it("should limit collection length to max value (b)", function() {
        expect(query.limit(42)).to.have.length.of(10);
        expect(query.at(0).slug).to.equal("p1");
        expect(query.at(1).slug).to.equal("p2");
      });

      it("should limit collection offset to start & max values (a)", function() {
        expect(query.limit(1, 2)).to.have.length.of(2);
        expect(query.at(0).slug).to.equal("p2");
        expect(query.at(1).slug).to.equal("p3");

      });

      it("should limit collection offset to start & max values (b)", function() {
        expect(query.limit(5, 42)).to.have.length.of(5);
        expect(query.at(0).slug).to.equal("p6");
        expect(query.at(4).slug).to.equal("p10");
      });
    });

    describe("#except", function() {
      var query;

      beforeEach(function() {
        query = new db.ArrayQuery([
          {slug: "pkga", nb: 3, tags: ["a", "b", "c"]},
          {slug: "pkgb", nb: 1, tags: ["a", "c"]},
          {slug: "pkgc", nb: 2, tags: ["c"]},
          {slug: "pkgd", nb: 0, tags: ["d"]}
        ]);
      });

      it("should retrieve records except a single defined field", function() {
        query.except("slug");
        expect(query).to.have.length.of(4);
        expect(query.at(0)).to.deep.equal({nb: 3, tags: ["a", "b", "c"]});
      });

      it("should retrieve records except multiple defined fields", function() {
        query.except("slug", "nb");
        expect(query).to.have.length.of(4);
        expect(query.at(0)).to.deep.equal({tags: ["a", "b", "c"]});
      });

      it("should retrieve records normally if no field is defined", function() {
        query.except();
        expect(query).to.have.length.of(4);
        expect(query.at(0)).to.deep.equal({slug: "pkga", nb: 3, tags: ["a", "b", "c"]});
      });
    });

    describe("#only", function() {
      var query;

      beforeEach(function() {
        query = new db.ArrayQuery([
          {slug: "pkga", nb: 3, tags: ["a", "b", "c"]},
          {slug: "pkgb", nb: 1, tags: ["a", "c"]},
          {slug: "pkgc", nb: 2, tags: ["c"]},
          {slug: "pkgd", nb: 0, tags: ["d"]}
        ]);
      });

      it("should retrieve records with a single defined field", function() {
        query.only("slug");
        expect(query).to.have.length.of(4);
        expect(query.at(0)).to.deep.equal({slug: "pkga"});
      });

      it("should retrieve records with multiple defined fields", function() {
        query.only("slug", "nb");
        expect(query).to.have.length.of(4);
        expect(query.at(0)).to.deep.equal({slug: "pkga", nb: 3});
      });

      it("should retrieve records normally if no field is defined", function() {
        query.only();
        expect(query).to.have.length.of(4);
        expect(query.at(0)).to.deep.equal({slug: "pkga", nb: 3, tags: ["a", "b", "c"]});
      });
    });

    describe("#virtual", function() {
      var query;

      beforeEach(function() {
        query = new db.ArrayQuery([{a: 1, b: 2}, {a: 2, b: 4}, {a: 4, b: 8}]);
      });

      it("should create a new virtual field for records", function() {
        query.virtual("c", function(record) {
          return record.a + record.b;
        });
        expect(query.all()).to.deep.equal([
          {a: 1, b: 2, c: 3},
          {a: 2, b: 4, c: 6},
          {a: 4, b: 8, c: 12}
        ]);
      });
    });

    describe("Chaining methods", function() {
      var query;

      beforeEach(function() {
        query = new db.ArrayQuery([
          {slug: "pkga", nb: 3, tags: ["a", "b", "c"]},
          {slug: "pkgb", nb: 1, tags: ["a", "c"]},
          {slug: "pkgc", nb: 2, tags: ["c"]},
          {slug: "pkgd", nb: 0, tags: ["d"]}
        ]);
      });

      it("should allow chaining", function() {
        query
          .filter({tags: "c"})
          .order("nb", "desc")
          .virtual("name", function(record) {
            return record.slug.toUpperCase();
          })
          .only("name");
        expect(query).to.have.length.of(3);
        expect(query.all()).to.deep.equal([
          {name: "PKGA"},
          {name: "PKGC"},
          {name: "PKGB"}
        ]);
      });
    });
  });

  describe("PackageQuery", function() {
    describe("#findFirstBySlug", function() {
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

    describe("#findByTag", function() {
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

    describe("#getPopular", function() {
      var query;

      beforeEach(function() {
        query = new db.PackageQuery(range(10).map(function(x) {
          x += 1;
          return {
            slug: "p" + x,
            createdAt: "2013-01-0" + x + "T00:00:00Z",
            updatedAt: "2013-01-0" + x + "T00:00:00Z",
            nbStargazers: x,
            nbIssues: x,
            nbIssues: x
          };
        }));
      });

      it("should retrieve popular package", function() {

      });
    });

    describe("#getRecent", function() {

    });

    describe("#getUpdated", function() {

    });
  });
});
