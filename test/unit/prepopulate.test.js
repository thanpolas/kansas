/**
 * @fileOverview Prepopulation unit tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var sinon = require('sinon');
var floordate = require('floordate');
var assert = chai.assert;

var Prepopulate = require('../../lib/db/populate.db');
var fixtures = require('../lib/fixtures');

suite('Prepopulation of usage keys', function() {
  this.timeout(4000);
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  suite('Skip one month ahead', function() {
    var clock;
    setup(function() {
      var floored = floordate(Date.now(), 'month');
      var moveFwd = 40 * 24 * 3600 * 1000;
      clock = sinon.useFakeTimers(floored.getTime() + moveFwd);
    });
    teardown(function() {
      clock.restore();
    });

    test('check prepopulation works', function(done) {
      var pre = new Prepopulate(fix.client, {prefix: 'test'});
      pre.prepopulate().then(function() {
        var keys = fix.tokenModel.getKeys(fix.tokenItem);
        var keysTwo = fix.tokenModel.getKeys(fix.tokenItemTwo);
        var pget = Promise.promisify(fix.client.get, fix.client);
        return Promise.all([
          pget(keys.usage),
          pget(keys.usageFuture),
          pget(keysTwo.usage),
          pget(keysTwo.usageFuture),
        ]).then(function(result) {
          assert.equal(result[0], 10, 'usage one');
          assert.equal(result[1], 10, 'usage one future');
          assert.equal(result[2], 10, 'usage two');
          assert.equal(result[3], 10, 'usage two future');
        });
        // you are here
      }).then(done, done);
    });
  });
});
