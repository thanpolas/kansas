/**
 * @fileOverview Setup Fixtures
 */
var Promise = require('bluebird');

var tester = require('../lib/tester');
var kansas = require('../../');
var Redis = require('../../lib/main/redis.main');

/**
 * The DB Initializer, nukes and populates the db with records.
 *
 * @contructor
 */
var Fixtures = module.exports = function() {

  /** @type {string} The database name used for nuking the db */
  this.dbName = 'test';

  /** @type {Redis}  */
  this.client = null;
  this.policyItem = null;
  this.policyItemBasic = null;
  this.policyCount = null;
  this.kansas = null;
  this.token = null;
  this.tokenItem = null;
  this.tokenItemTwo = null;
  this.tokenItemCount = null;

  this.policies = {
    free: {
      name: 'free',
      maxTokens: 3,
      limit: 10,
    },

    basic: {
      name: 'basic',
      maxTokens: 10,
      limit: 100,
    },

    count: {
      name: 'countPolicy',
      maxTokens: 20,
      count: true,
    },
  };
};

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
 * Start the initdb operation.
 *
 * @return {Promise} A Promise.
 */
Fixtures.prototype.start = Promise.method(function() {
  return this.connectRedis()
    .bind(this)
    .then(this.connectKansas)
    .then(this.nukedb)
    .then(this.createPolicies)
    .then(this.createTokenOne)
    .then(this.createTokenTwo)
    .then(this.createTokenCountOne)
    .return(this);
});

/**
 * Connect to Redis.
 *
 * @return {Promise}
 */
Fixtures.prototype.connectRedis = Promise.method(function() {
  var redis = new Redis();
  return redis.connect()
    .bind(this)
    .then(function(cl) {
      this.client = cl;
    });
});

/**
 * Initialize and connect Kansas.
 *
 * @return {Promise} A Promise.
 */
Fixtures.prototype.connectKansas = Promise.method(function() {
  this.kansas = kansas({
    prefix: 'test',
    logging: LOGGING,
    logLevel: LOG_LEVEL,
  });
  return this.kansas.connect();
});

Fixtures.prototype.nukedb = Promise.method(function() {
  return this.kansas.db.nuke('Yes purge all records irreversibly', this.dbName);
});

Fixtures.prototype.createPolicies = Promise.method(function() {
  this.policyItem = this.kansas.policy.create(this.policies.free);
  this.policyItemBasic = this.kansas.policy.create(this.policies.basic);
  this.policyCount = this.kansas.policy.create(this.policies.count);
});

Fixtures.prototype.createTokenOne = Promise.method(function() {
  return this.kansas.create({
    policyName: this.policyItem.name,
    ownerId: 'hip',
  })
    .bind(this)
    .then(function(item) {
      this.tokenItem = item;
      this.token = item.token;
    });
});

Fixtures.prototype.createTokenTwo = Promise.method(function() {
  return this.kansas.create({
    policyName: this.policyItem.name,
    ownerId: 'hip',
  })
    .bind(this)
    .then(function(item) {
      this.tokenItemTwo = item;
    });
});

Fixtures.prototype.createTokenCountOne = Promise.method(function() {
  return this.kansas.create({
    policyName: this.policyCount.name,
    ownerId: 'hop',
  })
    .bind(this)
    .then(function(item) {
      this.tokenItemCount = item;
    });
});

/**
 * Provide some fixtures in the store:
 * - A Policy "free", maxTokens: 3, limit: 10, period: month
 * - A Policy "basic", maxTokens: 10, limit: 100, period: month
 * - A Token of policy "free"
 * - A second Token of policy "free"
 *
 * @param {Function(Fixtures)=} optCb A callback with the Fixtures instance.
 */
Fixtures.setupCase = function(optCb) {
  var cb = optCb || function() {};

  tester.setup(function(done) {
    var fixture = new Fixtures();
    fixture.start()
      .bind(this)
      .then(function(fixtureInstance) {
        cb(fixtureInstance);
        this.client = fixtureInstance.client;
        this.policyItem = fixtureInstance.policyItem;
        this.policyItemBasic = fixtureInstance.policyItemBasic;
        this.policyCount = fixtureInstance.policyCount;
        this.kansas = fixtureInstance.kansas;
        this.token = fixtureInstance.token;
        this.tokenItem = fixtureInstance.tokenItem;
        this.tokenItemTwo = fixtureInstance.tokenItemTwo;
        this.tokenItemCount = fixtureInstance.tokenItemCount;
      })
      .then(done, done);
  });
};
