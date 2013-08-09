/* jshint camelcase:false */
/* global describe, it, beforeEach, afterEach */
var expect = require('chai').expect;
var sinon = require('sinon');
var importer = require('../lib/import');

describe("Importer", function() {
  var sandbox;

  beforeEach(function() {
    sandbox = sinon.sandbox.create();
    sandbox.stub(importer.check);
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe("repoType", function() {
    function expectType(url, type) {
      expect(importer.repoType(url)).to.equal(type);
    }

    it("should identify a json package definition", function() {
      expectType("https://github.com/foo/bar/tree/master/packages.json", "json");
    });

    it("should identify a github package repository", function() {
      expectType("https://github.com/foo/bar", "github");
    });

    it("should identify a bitbucket package repository", function() {
      expectType("https://bitbucket.org/foo/bar", "bitbucket");
    });

    it("should identify unsupported repositories", function() {
      expectType("https://foo.bar/plop", "unknown");
    });
  });
});
