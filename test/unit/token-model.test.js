/**
 * @fileOverview Token model unit tests.
 */

var chai = require('chai');
var assert = chai.assert;

var Redis = require('../../lib/main/redis.main');
var TokenModel = require('../../lib/models/token.model');
var PolicyModel = require('../../lib/models/policy.model');

// var tester = require('../lib/tester');

suite('Token Model', function() {
  var client;
  var tokenModel;
  var policyModel;
  var policyItem;

  setup(function(done) {
    if (client) { return done(); }
    var redis = new Redis();
    redis.connect().then(function(cl) {
      client = cl;
      done();
    }).catch(done);
  });
  setup(function() {
    policyModel = new PolicyModel();
    tokenModel = new TokenModel(client, {prefix: 'test:'});
    tokenModel.setPolicy(policyModel);
  });

  setup(function() {
    policyItem = policyModel.create({
      name: 'free',
      maxTokens: 3,
      limit: 100,
      period: 'month',
    });
  });

  test('create() returned properties', function(done) {
    tokenModel.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      assert.isObject(item);
      assert.property(item, 'token');
      assert.property(item, 'policyName');
      assert.property(item, 'limit');
      assert.property(item, 'period');
      assert.property(item, 'ownerId');
      assert.property(item, 'createdOn');
    }).then(done, done);
  });
  test('create() returned types', function(done) {
    tokenModel.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      assert.isString(item.token);
      assert.isString(item.policyName);
      // assert.isNumber(item.limit);
      assert.isString(item.period);
      assert.isString(item.ownerId);
      assert.isString(item.createdOn);
    }).then(done, done);
  });
  test('create() returned values', function(done) {
    tokenModel.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      assert.lengthOf(item.token, 32);
      assert.equal(item.policyName, 'free');
      assert.equal(item.limit, 100);
      assert.equal(item.period, 'month');
      assert.equal(item.ownerId, 'hip');
    }).then(done, done);
  });

});
