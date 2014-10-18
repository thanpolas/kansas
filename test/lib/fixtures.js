/**
 * @fileOverview Setup Fixtures
 */

var tester = require('./tester');
var logger = require('../../lib/main/logger.main');
var Clean = require('../../lib/db/clean.db');
var Redis = require('../../lib/main/redis.main');
var TokenModel = require('../../lib/models/token.model');
var PolicyModel = require('../../lib/models/policy.model');
var AccountingModel = require('../../lib/models/accounting.model');
var UsageModel = require('../../lib/models/usage.model');

var fixtures = module.exports = {};

var LOGGING = true;
var LOG_LEVEL = 0;


logger.init();
if (!LOGGING) {
  logger.mute();
} else {
  logger.unmute();
}
logger.setLevel(LOG_LEVEL);

/**
 * Provide some fixtures in the store:
 * - A Policy "free", maxTokens: 3, limit: 10, period: month
 * - A Policy "basic", maxTokens: 10, limit: 100, period: month
 * - A Token of policy "free"
 * - A second Token of policy "free"
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
  var accountingModel;
  var policyItem;
  var policyItemBasic;
  var tokenItem;
  var tokenItemTwo;
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
    clean.nuke('Yes purge all records irreversibly', 'test')
      .then(done, done);
  });
  tester.setup(function() {
    policyModel = new PolicyModel(client, {prefix: 'test'});
    tokenModel = new TokenModel(client, {prefix: 'test'});
    tokenModel.setPolicy(policyModel);
    usageModel = new UsageModel(client, {prefix: 'test'});
    accountingModel = new AccountingModel(client, {prefix: 'test'});
    accountingModel.setTokenModel(tokenModel);
  });

  tester.setup(function() {
    policyItem = policyModel.create({
      name: 'free',
      maxTokens: 3,
      limit: 10,
      period: 'month',
    });
  });

  tester.setup(function() {
    policyItemBasic = policyModel.create({
      name: 'basic',
      maxTokens: 10,
      limit: 100,
      period: 'month',
    });
  });

  tester.setup(function(done) {
    tokenModel.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItem = item;
    }).then(done, done);
  });
  tester.setup(function(done) {
    tokenModel.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItemTwo = item;
    }).then(done, done);
  });

  tester.setup(function() {
    cb({
      client: client,
      tokenModel: tokenModel,
      policyModel: policyModel,
      usageModel: usageModel,
      accountingModel: accountingModel,
      policyItem: policyItem,
      policyItemBasic: policyItemBasic,
      token: tokenItem.token,
      tokenItem: tokenItem,
      tokenItemTwo: tokenItemTwo,
    });
  });
};
