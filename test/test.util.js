/* jshint camelcase:false */
/* global describe, it */
var expect = require('chai').expect;
var libutil = require('../lib/util');

describe("cb", function() {
  it("should try to execute fn then send results using cb, 1 arg", function(done) {
    function asyncFn(foo, cb) {
      setTimeout(function() {
        cb(null, foo);
      }, 10);
    }

    asyncFn("foo", libutil.cb(function(foo) {
      return foo.toUpperCase();
    }, function(err, data) {
      expect(err).to.be.a("null");
      expect(data).eql("FOO");
      done();
    }));
  });

  it("should try to execute fn then send results using cb, 2 args", function(done) {
    function asyncFn(foo, bar, cb) {
      setTimeout(function() {
        cb(null, foo, bar);
      }, 10);
    }

    asyncFn(1, 2, libutil.cb(function(foo, bar) {
      return foo + bar;
    }, function(err, data) {
      expect(err).to.be.a("null");
      expect(data).eql(3);
      done();
    }));
  });

  it("should forward any error, 1 arg", function(done) {
    function asyncFn(a, cb) {
      setTimeout(function() {
        cb(new Error("plop"));
      }, 10);
    }

    asyncFn("x", libutil.cb(function(x) {
      return x;
    }, function(err) {
      expect(err).to.be.a.instanceOf(Error);
      done();
    }));
  });

  it("should forward any error, no arg", function(done) {
    function asyncFn(cb) {
      setTimeout(function() {
        cb(new Error("plop"));
      }, 10);
    }

    asyncFn(libutil.cb(function() {
      return;
    }, function(err) {
      expect(err).to.be.a.instanceOf(Error);
      done();
    }));
  });
});
