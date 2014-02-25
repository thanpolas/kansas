/**
 * @fileOverview Usage model unit tests.
 */

var chai = require('chai');
var assert = chai.assert;

var fixtures = require('../lib/fixtures');

suite('Usage Model', function() {
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  test.only('usage() consumes a unit', function(done) {
    fix.usageModel.consume(fix.token).then(function(remaining) {
      assert.equal(remaining, 99);
    }).then(done, done);
  });
});
