/**
 * @fileOverview Setup Fixtures
 */

var tester = require('./tester');
var Clean = require('../../lib/db/clean.db');
var Redis = require('../../lib/main/redis.main');
var TokenModel = require('../../lib/models/token.model');
var PolicyModel = require('../../lib/models/policy.model');
var UsageModel = require('../../lib/models/usage.model');

var fixtures = module.exports = {};

/**
 * Provide some fixtures in the store:
 * - A Policy "free", maxTokens: 3, limit: 100, period: month
 * - A Token of policy "free"
 *
 * @param {Function(Object)} cb A callback with an object providing all references:
 *   @param {redis.RedisClient} client A redis client.
 *   @param {kansas.model.TokenModel} tokenModel
 *   @param {kansas.model.PolicyModel} policyModel
 *   @param {string} policyItem
 *   @param {string} token
 *   @param {Object} tokenItem
 */
fixtures.setupCase = function(cb) {
  var client;
  var tokenModel;
  var policyModel;
  var policyItem;
  var tokenItem;
  var usageModel;

  tester.setup(function(done) {
    if (client) { return done(); }
    var redis = new Redis();
    redis.connect().then(function(cl) {
      client = cl;
      done();
    }).catch(done);
  });
  tester.setup(function(done) {
    var clean = new Clean(client, {prefix: 'test'});
    clean.nuke('Yes purge all records irreversably', 'test')
      .then(done, done);
  });
  tester.setup(function() {
    policyModel = new PolicyModel(client, {prefix: 'test'});
    tokenModel = new TokenModel(client, {prefix: 'test'});
    tokenModel.setPolicy(policyModel);
    usageModel = new UsageModel(client, {prefix: 'test'});
  });

  tester.setup(function(done) {
    policyModel.create({
      name: 'free',
      maxTokens: 3,
      limit: 100,
      period: 'month',
    }).then(function(policy) {
      policyItem = policy;
    }).then(done, done);
  });

  tester.setup(function(done) {
    tokenModel.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItem = item;
    }).then(done, done);
  });

  tester.setup(function() {
    cb({
      client: client,
      tokenModel: tokenModel,
      policyModel: policyModel,
      usageModel: usageModel,
      policyItem: policyItem,
      token: tokenItem.token,
      tokenItem: tokenItem,
    });
  });
};
