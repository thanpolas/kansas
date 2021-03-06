/**
 * @fileOverview Usage model unit tests.
 */
var Promise = require('bluebird');
var sinon = require('sinon');
var floordate = require('floordate');
var assert = require('chai').assert;

var kansasError = require('../../lib/util/error');
var fixtures = require('../lib/fixtures');

describe('Usage Model', function() {
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });


  it('usage() consumes a unit', function(done) {
    fix.usageModel.consume(fix.token).then(function(remaining) {
      assert.equal(remaining, 9);
    }).then(done, done);
  });
  it('usage() over limit returns error', function(done) {

    // create an array with 10 elements of the token to consume.
    var consume = Array.apply(null, new Array(10)).map(function() {
      return fix.token;
    });
    Promise.map(consume, function(token) {
      return fix.usageModel.consume(token);
    })
      .then(function() {
        return fix.usageModel.consume(fix.token).then(function() {
          throw new Error('Should not allow to consume');
        }).catch(function(err) {
          assert.instanceOf(err, kansasError.UsageLimit);
        });
      }).then(done, done);
  });
  it('usage() accepts units to consume', function(done) {
    fix.usageModel.consume(fix.token, 10)
      .then(function() {
        return fix.usageModel.consume(fix.token).then(function() {
          throw new Error('Should not allow to consume');
        }).catch(function(err) {
          assert.instanceOf(err, kansasError.UsageLimit);
        });
      }).then(done, done);
  });

  describe('Check month period', function() {
    var clock;
    beforeEach(function() {
      var floored = floordate(Date.now(), 'month');
      clock = sinon.useFakeTimers(floored.getTime());
    });
    afterEach(function() {
      clock.restore();
    });
    it('Will roll over to next month and reset limit', function(done) {
      var consume = Array.apply(null, new Array(10)).map(function() {
        return fix.token;
      });

      Promise.map(consume, function(token) {
        return fix.usageModel.consume(token);
      })
        .then(function() {

          // move time fwd 40days.
          var moveFwd = 40 * 24 * 3600 * 1000;
          clock.tick(moveFwd);
          return fix.usageModel.consume(fix.token).then(function(remaining) {
            assert(remaining, 9);
          });
        }).then(done, done);
    });
  });
});

