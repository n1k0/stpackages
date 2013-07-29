/* global describe, it, beforeEach, afterEach */
var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('request');
var db = require('../lib/db');
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
      app.start();
    });

    afterEach(function(done) {
      sandbox.restore();
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
          expect(res.body).to.have.length.of(3);
          expect(res.body.map(function(x) {
            return x.slug;
          })).to.deep.equal(['b', 'c', 'a']);
          done();
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
          expect(res.body).to.have.length.of(3);
          expect(res.body.map(function(x) {
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
          expect(res.body).to.have.length.of(3);
          expect(res.body.map(function(x) {
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
