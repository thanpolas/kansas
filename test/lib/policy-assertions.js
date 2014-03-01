/**
 * @fileOverview Policy item assertions helper.
 */
var chai = require('chai');

var policyAssert = module.exports = {};

/** Perform all Assertions */
policyAssert.all = function(item, expected) {
  policyAssert.properties(item);
  policyAssert.types(item);
  policyAssert.values(item, expected);
};

/** Perform property Assertions */
policyAssert.properties = function(item) {
  var assert = chai.assert;
  assert.isObject(item);
  assert.property(item, 'prop: name');
  assert.property(item, 'prop: maxTokens');
  assert.property(item, 'prop: limit');
  assert.property(item, 'prop: period');
};

/** Assert props are of correct type */
policyAssert.types = function(item) {
  var assert = chai.assert;
  assert.isString(item.name, 'type: name');
  assert.isNumber(item.maxTokens, 'type: maxTokens');
  assert.isNumber(item.limit, 'type: limit');
  assert.isString(item.period, 'type: period');
};

/** Assert values match */
policyAssert.values = function(item, optExpected) {
  var assert = chai.assert;
  var expected = optExpected || {};
  assert.equal(item.name, expected.name || 'free');
  assert.equal(item.maxTokens, expected.limit || 3);
  assert.equal(item.limit, expected.limit || 10);
  assert.equal(item.period, expected.period || 'month');
};
