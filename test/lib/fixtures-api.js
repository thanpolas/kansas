/**
 * @fileOverview Setup Fixtures
 */

var tester = require('./tester');
var kansas = require('../../');
var Redis = require('../../lib/main/redis.main');

var fixtures = module.exports = {};

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
  var api;
  var policyItem;
  var policyItemBasic;
  var tokenItem;
  var tokenItemTwo;

  tester.setup(function(done) {
    if (client) { return done(); }
    var redis = new Redis();
    redis.connect().then(function(cl) {
      client = cl;
      done();
    }).catch(done);
  });
  beforeEach(function(done) {
    api = kansas({prefix: 'test'});
    api.connect().then(done, done);
  });


  tester.setup(function(done) {
    api.db.nuke('Yes purge all records irreversably', 'test')
      .then(done, done);
  });

  tester.setup(function() {
    policyItem = api.policy.create({
      name: 'free',
      maxTokens: 3,
      limit: 10,
      period: 'month',
    });
  });

  tester.setup(function() {
    policyItemBasic = api.policy.create({
      name: 'basic',
      maxTokens: 10,
      limit: 100,
      period: 'month',
    });
  });

  tester.setup(function(done) {
    api.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItem = item;
    }).then(done, done);
  });
  tester.setup(function(done) {
    api.create({
      policyName: policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      tokenItemTwo = item;
    }).then(done, done);
  });

  tester.setup(function() {
    cb({
      client: client,
      api: api,
      policyItem: policyItem,
      policyItemBasic: policyItemBasic,
      token: tokenItem.token,
      tokenItem: tokenItem,
      tokenItemTwo: tokenItemTwo,
    });
  });
};
