/**
 * @fileOverview Token item assertions helper.
 */
var chai = require('chai');
var assert = chai.assert;

var period = require('../../lib/models/period-bucket.model');

var tokenAssert = module.exports = {};

/** Assert tokenItem contains the right properties */
tokenAssert.properties = function(tokenItem) {
  assert.isObject(tokenItem);
  assert.property(tokenItem, 'token');
  assert.property(tokenItem, 'policyName');
  assert.property(tokenItem, 'limit');
  assert.property(tokenItem, 'period');
  assert.property(tokenItem, 'remaining');
  assert.property(tokenItem, 'ownerId');
  assert.property(tokenItem, 'createdOn');
};

/** Assert tokenItem props are of correct type */
tokenAssert.types = function(tokenItem) {
  assert.isString(tokenItem.token, 'token');
  assert.isString(tokenItem.policyName, 'policyName');
  assert.isNumber(tokenItem.limit, 'limit');
  assert.isNumber(tokenItem.remaining, 'remaining');
  assert.isString(tokenItem.period, 'period');
  assert.isString(tokenItem.ownerId, 'ownerId');
  assert.isString(tokenItem.createdOn, 'createdOn');
};

/** Assert tokenItem values match */
tokenAssert.values = function(tokenItem, optCompare) {
  var compare = optCompare || {};
  assert.lengthOf(tokenItem.token, compare.token || 32);
  assert.equal(tokenItem.policyName, compare.policyName || 'free');
  assert.equal(tokenItem.limit, compare.limit || 10);
  assert.equal(tokenItem.remaining, compare.remaining || 10);
  assert.equal(tokenItem.period, compare.period || 'month');
  assert.equal(tokenItem.ownerId, compare.ownerId || 'hip');
};

tokenAssert.checkKeys = function(tokenItem) {
  var periodBucket = period.get('month');
  var periodBucketFuture = period.getFuture('month');
  var indexKey = 'test:kansas:index:token:' + tokenItem.ownerId;
  var keys = [
    'test:kansas:token:' + tokenItem.token,
    'test:kansas:usage:' + periodBucket + ':' + tokenItem.token,
    'test:kansas:usage:' + periodBucketFuture + ':' + tokenItem.token,
    indexKey,
  ];
  return tokenModel.existsAll(keys).then(function(result) {
    assert.ok(!!result[0], 'token');
    assert.ok(!!result[1], 'usage');
    assert.ok(!!result[2], 'index');
    return new Promise(function(resolve, reject) {
      client.sismember(indexKey, tokenItem.token, function(err, res) {
        if (err) { return reject(); }
        assert.ok(!!res, 'index.token');
        resolve();
      });
    });
  });
};
