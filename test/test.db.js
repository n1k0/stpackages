/* jshint camelcase:false */
/* global describe, it */
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
});
