/**
 * @fileOverview Usage model unit tests.
 */

var chai = require('chai');
var assert = chai.assert;

var UsageModel = require('../../lib/models/usage.model');
var fixtures = require('../lib/fixtures');

suite('Usage Model', function() {
  var fix;
  var usageModel;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  setup(function() {
    usageModel = new UsageModel(fix.client, {prefix: 'test'});
  });

  test('usage() consumes a unit', function(done) {
    usageModel.consume(fix.token).then(function(remaining) {
      assert.equal(remaining, 99);
    }).then(done, done);
  });
});
