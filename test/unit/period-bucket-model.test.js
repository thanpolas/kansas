/**
 * @fileOverview Usage model unit tests.
 */
var assert = require('chai').assert;

var period = require('../../lib/models/period-bucket.model');

describe('Period Bucket Model', function() {

  it('period.getFuture() returns expected result', function() {
    var res = period.getFuture('month', 1);
    var items = res.split('-');
    assert.lengthOf(items, 3);
    assert.lengthOf(items[0], 4);
    assert.lengthOf(items[1], 2);
    assert.equal(items[2], '01');
  });
});
