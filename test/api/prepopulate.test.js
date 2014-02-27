/**
 * @fileOverview Prepopulation unit tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var sinon = require('sinon');
var floordate = require('floordate');
var expect = chai.expect;

var fixtures = require('../lib/fixtures-api');

describe('Prepopulation of usage keys', function() {
  this.timeout(4000);
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  describe('Skip one month ahead', function() {
    var clock;
    beforeEach(function() {
      var floored = floordate(Date.now(), 'month');
      var moveFwd = 40 * 24 * 3600 * 1000;
      clock = sinon.useFakeTimers(floored.getTime() + moveFwd);
    });
    afterEach(function() {
      clock.restore();
    });

    it('check prepopulation works', function(done) {
      fix.api.db.prepopulate().then(function() {
        var keys = fix.api.tokenModel.getKeys(fix.tokenItem);
        var keysTwo = fix.api.tokenModel.getKeys(fix.tokenItemTwo);
        var pget = Promise.promisify(fix.client.get, fix.client);
        return Promise.all([
          pget(keys.usage),
          pget(keys.usageFuture),
          pget(keysTwo.usage),
          pget(keysTwo.usageFuture),
        ]).then(function(result) {
          expect(result[0]).to.equal('10', 'usage one');
          expect(result[1]).to.equal('10', 'usage one future');
          expect(result[2]).to.equal('10', 'usage two');
          expect(result[3]).to.equal('10', 'usage two future');
        });
        // you are here
      }).then(done, done);
    });
  });
});
