/**
 * @fileOverview Setup Fixtures
 */

var tester = require('./tester');
var kansas = require('../../');
var Redis = require('../../lib/main/redis.main');

var fixtures = module.exports = {};

var LOGGING = true;
/**
 *   SEVERE: 1000
 *   WARN:   800
 *   INFO:   600
 *   FINE:   400
 *   FINER:  200
 *   FINEST: 100
 */
var LOG_LEVEL = 0;

/**
 * Provide some fixtures in the store:
 * - A Policy "free", maxTokens: 3, limit: 10, period: month
 * - A Policy "basic", maxTokens: 10, limit: 100, period: month
 * - A Token of policy "free"
 * - A second Token of policy "free"
 *
 * @param {Function(Object)=} optCb A callback with an object providing all references:
 *   @param {redis.RedisClient} client A redis client.
 *   @param {kansas.model.TokenModel} tokenModel
 *   @param {kansas.model.PolicyModel} policyModel
 *   @param {string} policyItem
 *   @param {string} token
 *   @param {Object} tokenItem
 */
fixtures.setupCase = function(optCb) {
  var cb = optCb || function() {};

  var policyFree = {
    name: 'free',
    maxTokens: 3,
    limit: 10,
  };

  var policyBasic = {
    name: 'basic',
    maxTokens: 10,
    limit: 100,
  };

  var policyCount = {
    name: 'countPolicy',
    maxTokens: 20,
    count: true,
  };

  tester.setup(function(done) {
    if (this.client) { return done(); }
    var redis = new Redis();
    var self = this;
    redis.connect().then(function(cl) {
      self.client = cl;
      done();
    }).catch(done);
  });
  beforeEach(function(done) {
    this.kansas = kansas({
      prefix: 'test',
      logging: LOGGING,
      logLevel: LOG_LEVEL,
    });
    this.kansas.connect().then(done, done);
  });


  tester.setup(function(done) {
    this.kansas.db.nuke('Yes purge all records irreversably', 'test')
      .then(done, done);
  });

  tester.setup(function() {
    this.policyItem = this.kansas.policy.create(policyFree);
    this.policyItemBasic = this.kansas.policy.create(policyBasic);
    this.policyCount = this.kansas.policy.create(policyCount);
  });

  tester.setup(function(done) {
    var self = this;
    this.kansas.create({
      policyName: this.policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      self.tokenItem = item;
      self.token = item.token;
    }).then(done, done);
  });

  tester.setup(function(done) {
    var self = this;
    this.kansas.create({
      policyName: this.policyItem.name,
      ownerId: 'hip',
    }).then(function(item) {
      self.tokenItemTwo = item;
    }).then(done, done);
  });

  tester.setup(function(done) {
    var self = this;
    this.kansas.create({
      policyName: this.policyCount.name,
      ownerId: 'hop',
    }).then(function(item) {
      self.tokenItemCount = item;
    }).then(done, done);
  });

  tester.setup(function() {
    cb({
      client: this.client,
      api: this.kansas,
      policyItem: this.policyItem,
      policyItemBasic: this.policyItemBasic,
      token: this.token,
      tokenItem: this.tokenItem,
      tokenItemTwo: this.tokenItemTwo,
    });
  });
};
