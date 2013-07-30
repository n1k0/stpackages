/* global describe, it, beforeEach, afterEach */
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('request');
var db = require('../lib/db');
var range = require('../lib/util').range;
var app = require('../app').app;

describe("App", function() {
  describe("routes", function() {
    var sandbox;

    var http = {
      get: function(path, cb) {
        var url = 'http://0.0.0.0:3000' + path;
        request.get(url, {}, function(err, res, body) {
          if (err)
            throw new Error('Unable to GET ' + url + ': ' + err.message);
          cb({
            headers: res.headers,
            body: JSON.parse(body)
          });
        });
      }
    };

    beforeEach(function() {
      sandbox = sinon.sandbox.create();
      sandbox.stub(db, "load");
      app.set("data", []);
      app.start();
    });

    afterEach(function(done) {
      sandbox.restore();
      app.set("data", []);
      try {
        app.close(done);
      } catch (err) {
        done();
      }
    });

    describe('GET /api/recent', function() {
      it("should list recent packages", function(done) {
        app.set('data', [
          {slug: "a", createdAt: "2013-01-01T00:00:00Z"},
          {slug: "b", createdAt: "2013-03-01T00:00:00Z"},
          {slug: "c", createdAt: "2013-02-01T00:00:00Z"}
        ]);
        http.get('/api/recent', function(res) {
          expect(res.headers['content-type']).to.equal('application/json');

          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('total', 'packages');

          expect(res.body.total).to.equal(3);
          expect(res.body.packages).to.have.length.of(3);
          expect(res.body.packages.map(function(x) {
            return x.slug;
          })).to.deep.equal(['b', 'c', 'a']);
          done();
        });
      });

      describe("Pagination", function() {
        var perPageBackup;

        beforeEach(function() {
          perPageBackup = app.get('per page');
          app.set('per page', 2);
          app.set('data', range(9).map(function(x) {
            x += 1;
            return {slug: "p" + x, createdAt: "2013-01-0" + x + "T00:00:00Z"};
          }));
        });

        afterEach(function() {
          app.set('per page', perPageBackup);
        })

        it("should retrieve 1st page", function(done) {
          http.get('/api/recent?offset=0', function(res) {
            expect(res.body.total).to.equal(9);
            expect(res.body.packages.map(function(x) {
              return x.slug;
            })).to.deep.equal(['p9', 'p8']);
            done();
          });
        });

        it("should retrieve 2nd page", function(done) {
          http.get('/api/recent?offset=2', function(res) {
            expect(res.body.total).to.equal(9);
            expect(res.body.packages.map(function(x) {
              return x.slug;
            })).to.deep.equal(['p7', 'p6']);
            done();
          });
        });

        it("should retrieve 5th page", function(done) {
          http.get('/api/recent?offset=8', function(res) {
            expect(res.body.total).to.equal(9);
            expect(res.body.packages.map(function(x) {
              return x.slug;
            })).to.deep.equal(['p1']);
            done();
          });
        });
      });
    });

    describe('GET /api/updated', function() {
      it("should list updated packages", function(done) {
        app.set('data', [
          {slug: "a", updatedAt: "2013-01-01T00:00:00Z"},
          {slug: "b", updatedAt: "2013-03-01T00:00:00Z"},
          {slug: "c", updatedAt: "2013-02-01T00:00:00Z"}
        ]);
        http.get('/api/updated', function(res) {
          expect(res.headers['content-type']).to.equal('application/json');

          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('total', 'packages');

          expect(res.body.total).to.equal(3);
          expect(res.body.packages).to.have.length.of(3);
          expect(res.body.packages.map(function(x) {
            return x.slug;
          })).to.deep.equal(['b', 'c', 'a']);
          done();
        });
      });
    });

    describe('GET /api/popular', function() {
      it("should list popular packages", function(done) {
        app.set('data', [
          {
            slug: "a",
            updatedAt: "2013-01-01T00:00:00Z",
            createdAt: "2013-01-01T00:00:00Z",
            nbStargazers: 1,
            nbForks: 1,
            nbIssues: 100
          },
          {
            slug: "b",
            updatedAt: "2013-01-01T00:00:00Z",
            createdAt: "2013-01-01T00:00:00Z",
            nbStargazers: 10000,
            nbForks: 100,
            nbIssues: 1
          },
          {
            slug: "c",
            updatedAt: "2013-01-01T00:00:00Z",
            createdAt: "2013-01-01T00:00:00Z",
            nbStargazers: 100,
            nbForks: 1,
            nbIssues: 1
          }
        ]);
        http.get('/api/popular', function(res) {
          expect(res.headers['content-type']).to.equal('application/json');

          expect(res.body).to.be.a('object');
          expect(res.body).to.have.keys('total', 'packages');

          expect(res.body.total).to.equal(3);
          expect(res.body.packages).to.have.length.of(3);
          expect(res.body.packages.map(function(x) {
            return x.slug;
          })).to.deep.equal(['b', 'c', 'a']);
          done();
        });
      });
    });

    describe('GET /api/search', function() {
      it("should list searched packages");
    });

    describe('GET /api/details/:slug', function() {
      it("should retrieve package details");
    });
  });
});
