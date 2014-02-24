/**
 * @fileOverview The tokens model.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');
var log = require('../util/logger').getLogger('kansas.model.Token');

var Model = require('./model-redis');

var period = require('./period-bucket.model');
var helpers = require('../util/helpers');
var kansasError = require('../util/error');

var Token = module.exports = Model.extend(function() {
  // wire set/del/get
  middlewarify.make(this, 'set', this.create.bind(this));
  middlewarify.make(this, 'del', this.remove.bind(this));
  middlewarify.make(this, 'get', this.hgetall.bind(this));

  this.namespace = 'token';
  this.idProp = 'token';

  /** @type {?kansas.model.Policy} An instance of Policy model */
  this.policy = null;
});

/**
 * DI the policy instance to use.
 *
 * @param {kansas.model.Policy} policy The Policy model instance.
 */
Token.prototype.setPolicy = function(policy) {
  this.policy = policy;
};

/**
 * Will create a new token and return the value.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} policyName The policy name.
 *   @param {string} ownerId Arbitrary string that identifies the owner.
 * @return {Promise(Object)} A promise with the new item.
 */
Token.prototype.create = Promise.method(function(userValues) {
  log.finer('create() :: Creating new token for policyName:',
    userValues.policyName, 'ownerId:', userValues.ownerId);

  if (!this.policy.has(userValues.policyName)) {
    var err = new kansasError.Policy('Policy with name "' +
      userValues.policyName + '" not found!');
    err.type = kansasError.Policy.Type.NOT_FOUND;

    log.error('create() :: Policy not found:', userValues.policyName,
      this.policy.store.toObject());
    throw err;
  }

  var policy = this.policy.get(userValues.policyName);

  var item = Object.create(null);
  item.token = helpers.generateRandomString(32);
  item.policyName = policy.name;
  item.limit = policy.limit;
  item.period = policy.period;
  item.ownerId = userValues.ownerId;
  item.createdOn = (new Date()).toISOString();
  return this._createItem(item.token, item);
});

/**
 * Atomicaly save:
 *   - The token item
 *   - Create an index for ownerId
 *   - Populate usage key
 *
 * @param {string} key The key to save to sans prefix.
 * @param {Object} item Key value pairs.
 * @return {Promise(Object)} A promise with the new item.
 */
Token.prototype._createItem = function(token, item) {
  var self = this;
  return new Promise(function(resolve, reject) {
    function handleCb(err) {
      if (err) {return reject(err);}
      resolve(item);
    }

    var periodBucket = period.get(item.period);
    var usageKey = this.prefix + 'usage:' + periodBucket + ':' + token;

    var indexKeyPrefix = self.prefix + 'index:' + self.namespace + ':';
    var indexValue = item.ownerId;
    var indexKey = indexKeyPrefix + indexValue;

    self.client.multi()
      .hmset(self.getPrefix() + token, item)
      .sadd(indexKey, token)
      .set(usageKey, item.limit)
      .exec(handleCb);
  });
};

/**
 * Remove a token and all references in an atomic operation.
 *
 * @param {string} token The token to remove.
 * @return {Promise} A promise.
 */
Token.prototype.remove = Promise.method(function(token) {
  // fetch the token first
  return this.get(token)
    .then(this._removeActual.bind(this));
});

/**
 * The actual remove operation.
 *
 * @param {Object} item The item to remove.
 * @return {Promise} A promise.
 */
Token.prototype._removeActual = function(item) {
  var self = this;
  return new Promise(function(resolve, reject) {
    function handleCb(err) {
      if (err) {return reject(err);}
      resolve();
    }

    var periodBucket = period.get(item.period);
    var futurePeriodBucket = period.getFuture(item.period);
    var usageKey = this.prefix + 'usage:' + periodBucket + ':' + item.token;
    var futureUsageKey = this.prefix + 'usage:' + futurePeriodBucket + ':' +
      item.token;

    var indexKeyPrefix = self.prefix + 'index:' + self.namespace + ':';
    var indexValue = item.ownerId;
    var indexKey = indexKeyPrefix + indexValue;

    self.client.multi()
      .del(self.getPrefix() + item.token)
      .srem(indexKey, item.token)
      .del(usageKey)
      .del(futureUsageKey)
      .exec(handleCb);
  });
};
