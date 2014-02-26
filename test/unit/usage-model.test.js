/**
 * @fileOverview Usage model unit tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var kansasError = require('../../lib/util/error');
var assert = chai.assert;

var fixtures = require('../lib/fixtures');

suite('Usage Model', function() {
  this.timeout(4000);
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  test('usage() consumes a unit', function(done) {
    fix.usageModel.consume(fix.token).then(function(remaining) {
      assert.equal(remaining, 9);
    }).then(done, done);
  });
  test('usage() over limit returns error', function(done) {

    // create an array with 10 elements of the token to consume.
    var consume = Array.apply(null, new Array(10)).map(function() {
      return fix.token;
    });

    Promise.map(consume, fix.usageModel.consume.bind(fix.usageModel))
      .then(function() {
        return fix.usageModel.consume(fix.token).then(function() {
          throw new Error('Should not allow to consume');
        }).catch(function(err) {
          assert.instanceOf(err, kansasError.UsageLimit);
        });
      }).then(done, done);
  });
});
