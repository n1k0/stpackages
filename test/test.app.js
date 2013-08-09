/* global describe, it, beforeEach, afterEach */

process.env.ELASTIC_SEARCH_INDICE = "stpackages-test";

var expect = require('chai').expect;
var sinon = require('sinon');
var request = require('request');
var path = require('path');
var libsearch = require('../lib/search');
var app = require('../lib/app');

function GET(path, cb) {
  var url = 'http://0.0.0.0:1234' + path;
  request.get(url, {}, function(err, res, body) {
    if (err)
      throw new Error('Unable to GET ' + url + ': ' + err.message);
    cb({
      status: res.statusCode,
      headers: res.headers,
      body: JSON.parse(body)
    });
  });
}

describe("App", function() {
  describe("routes", function() {
    var sandbox;

    beforeEach(function(done) {
      sandbox = sinon.sandbox.create();
      var index = new libsearch.SearchIndex({indice: "stpackages-test"});
      index.dropAll(function() {
        var fixtures = path.join(__dirname, 'fixtures', 'fixtures.json');
        index.loadFromFile(fixtures, function() {
          app.start(1234, done);
        });
      });
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
        GET('/api/recent', function(res) {
          expect(res.status).eql(200);
          expect(res.body.total).eql(2);
          expect(res.body.packages).to.have.length.of(2);
          done();
        });
      });
    });

    describe('GET /api/updated', function() {
      it("should list updated packages", function(done) {
        GET('/api/updated', function(res) {
          expect(res.status).eql(200);
          expect(res.body.total).eql(2);
          expect(res.body.packages).to.have.length.of(2);
          done();
        });
      });
    });

    describe('GET /api/popular', function() {
      it("should list popular packages", function(done) {
        GET('/api/popular', function(res) {
          expect(res.status).eql(200);
          expect(res.body.total).eql(2);
          expect(res.body.packages).to.have.length.of(2);
          done();
        });
      });
    });

    describe('GET /api/search', function() {
      it("should list searched packages", function(done) {
        GET('/api/search?q=foo', function(res) {
          expect(res.status).eql(200);
          expect(res.body.total).eql(1);
          expect(res.body.packages).to.have.length.of(1);
          done();
        });
      });
    });

    describe('GET /api/details/:slug', function() {
      it("should retrieve package details", function(done) {
        GET('/api/details/pkg1', function(res) {
          expect(res.status).eql(200);
          expect(res.body.name).eql("Package 1");
          done();
        });
      });
    });
  });
});
