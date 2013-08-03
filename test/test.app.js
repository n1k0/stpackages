/* global describe, it, beforeEach, afterEach */
//var expect = require('chai').expect;
var sinon = require('sinon');
//var request = require('request');
var app = require('../app').app;

describe("App", function() {
  describe("routes", function() {
    var sandbox;

    // var http = {
    //   get: function(path, cb) {
    //     var url = 'http://0.0.0.0:5000' + path;
    //     request.get(url, {}, function(err, res, body) {
    //       if (err)
    //         throw new Error('Unable to GET ' + url + ': ' + err.message);
    //       cb({
    //         headers: res.headers,
    //         body: JSON.parse(body)
    //       });
    //     });
    //   }
    // };

    beforeEach(function() {
      sandbox = sinon.sandbox.create();
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
      it("should list recent packages");
    });

    describe('GET /api/updated', function() {
      it("should list updated packages");
    });

    describe('GET /api/popular', function() {
      it("should list popular packages");
    });

    describe('GET /api/search', function() {
      it("should list searched packages");
    });

    describe('GET /api/details/:slug', function() {
      it("should retrieve package details");
    });
  });
});
