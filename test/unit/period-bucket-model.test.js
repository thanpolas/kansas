/**
 * @fileOverview Usage model unit tests.
 */

var chai = require('chai');
var assert = chai.assert;

var period = require('../../lib/models/period-bucket.model');

var fixtures = require('../lib/fixtures');

suite('Period Bucket Model', function() {

  test('period.getFuture() returns expected result', function() {
    var res = period.getFuture('month', 1);
    var items = res.split('-');
    assert.lengthOf(items, 3);
    assert.lengthOf(items[0], 4);
    assert.lengthOf(items[1], 2);
    assert.equal(items[2], '01');
  });
});
