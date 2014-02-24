/**
 * @fileOverview Setup Fixtures
 */

var tester = require('./tester');
var Redis = require('../../lib/main/redis.main');
var TokenModel = require('../../lib/models/token.model');
var PolicyModel = require('../../lib/models/policy.model');

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
 *   @param {string} policyId
 *   @param {string} token
 *   @param {Object} tokenItem
 */
fixtures.setupCase = function(cb) {
  var client;
  var tokenModel;
  var policyModel;
  var policyId;
  var tokenItem;

  tester.setup(function(done) {
    if (client) { return done(); }
    var redis = new Redis();
    redis.connect().then(function(cl) {
      client = cl;
      done();
    }).catch(done);
  });
  tester.setup(function() {
    policyModel = new PolicyModel(client, {prefix: 'test:'});
    tokenModel = new TokenModel(client, {prefix: 'test:'});
  });

  tester.setup(function(done) {
    if (policyId) { return done(); }
    policyModel.create({
      name: 'free',
      maxTokens: 3,
      limit: 100,
      period: 'month',
    }).then(function(policy) {
      policyId = policy.id;
    }).then(done, done);
  });

  tester.setup(function(done) {
    tokenModel.create({
      policyId: policyId,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItem = item;
    }, done);
  });

  tester.setup(function() {
    cb({
      client: client,
      tokenModel: tokenModel,
      policyModel: policyModel,
      policyId: policyId,
      token: tokenItem.token,
      tokenItem: tokenItem,
    });
  });
};
