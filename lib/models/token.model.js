/**
 * @fileOverview The tokens model.
 */
var __ = require('lodash');
var Promise = require('bluebird');
var middlewarify = require('middlewarify');


var logger = require('../main/logger.main');
var EventBus = require('../main/event-bus.main');
var Model = require('./model-redis');
var period = require('./period-bucket.model');
var helpers = require('../util/helpers');
var kansasError = require('../util/error');
var UsageModel = require('./usage.model');

/**
 * The token model.
 *
 * @param {redis.RedisClient} client The redis client to use.
 * @param {Object} opts A dict with the following options:
 *   @param {string=} prefix Prefix to use for all keys.
 * @constructor
 * @extends {kansas.model.Redis}
 */
var Token = module.exports = Model.extend(function() {
  this.log = logger.getLogger('kansas.model.Token');

  // wire set/del/get
  middlewarify.make(this, 'set', this.create.bind(this), {beforeAfter: true});
  middlewarify.make(this, 'del', this.remove.bind(this), {beforeAfter: true});
  middlewarify.make(this, 'get', this.getActual.bind(this), {beforeAfter: true});
  middlewarify.make(this, 'getByOwnerId', this.getByOwnerIdActual.bind(this),
    {beforeAfter: true});

  // enforce policy token limits
  this.set.before(this.validateOwnerId.bind(this));
  this.set.before(this.validatePolicy.bind(this));
  this.set.before(this.enforcePolicyLimits.bind(this));

  this.namespace = 'token';
  this.idProp = 'token';

  this.scard = Promise.promisify(this.client.scard, {context: this.client});
  this.smembers = Promise.promisify(this.client.smembers, {context: this.client});
  this.getRedis = Promise.promisify(this.client.get, {context: this.client});

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
 * Will check if policy is valid.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} policyName The policy name.
 *   @param {string} ownerId Arbitrary string that identifies the owner.
 * @return {Promise} A promise.
 */
Token.prototype.validatePolicy = Promise.method(function(userValues) {
  if (!this.policy.has(userValues.policyName)) {
    var err = new kansasError.Policy('Policy with name "' +
      userValues.policyName + '" not found!');
    err.type = kansasError.Policy.Type.NOT_FOUND;

    this.log.info('validatePolicy() :: Policy not found:', userValues.policyName,
      'for ownerId:', userValues.ownerId, this.policy.store.toObject());
    throw err;
  }
});

/**
 * Will check if policy is valid.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} policyName The policy name.
 *   @param {string} ownerId Arbitrary string that identifies the owner.
 * @throws {kansas.error.Validation} If wont pass validation.
 */
Token.prototype.validateOwnerId = function(userValues) {
  if (typeof userValues.ownerId !== 'string' || !userValues.ownerId.length)  {
    var err = new kansasError.Validation('Property "ownerId" not of right type.');
    err.value = userValues.ownerId;
    throw err;
  }
};

/**
 * Will enforce the policy token limits.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} policyName The policy name.
 *   @param {string} ownerId Arbitrary string that identifies the owner.
 * @return {Promise} A promise.
 */
Token.prototype.enforcePolicyLimits = Promise.method(function(userValues) {
  var indexKey = this.prefix + 'index:' + this.namespace + ':' +
    userValues.ownerId;
  var self = this;
  return this.scard(indexKey).then(function(total) {
    var policy = self.policy.get(userValues.policyName);

    self.log.finer('enforcePolicyLimits() :: OwnerId:', userValues.ownerId,
      'policyName:', userValues.policyName, 'Total tokens:', total,
      'Max Tokens:', policy.maxTokens);

    if (total >= policy.maxTokens) {
      self.log.info('enforcePolicyLimits() :: Max num of Tokens reached for ownerId:',
        userValues.ownerId, 'Policy MaxTokens:', policy.maxTokens,
        'Owner Tokens:', total);
      var error = new kansasError.Policy('Maximum number of allowed tokens reached');
      error.type = kansasError.Policy.Type.MAX_TOKENS_PER_USER;
      self.emit(EventBus.Event.MAX_TOKENS, userValues, policy.maxTokens);
      throw error;
    }
  });
});

/**
 * Will create a new token and return the value.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} policyName The policy name.
 *   @param {string} ownerId Arbitrary string that identifies the owner.
 *   @param {string=} token Optionally define a custom token.
 * @return {Promise(Object)} A promise with the new item.
 */
Token.prototype.create = Promise.method(function(userValues) {
  this.log.finer('create() :: Creating new token for policyName:',
    userValues.policyName, 'ownerId:', userValues.ownerId,
    'CustomToken:', userValues.token);

  var policy = this.policy.get(userValues.policyName);

  var item = Object.create(null);
  item.token = userValues.token || helpers.generateRandomString(32);
  item.policyName = policy.name;
  item.limit = policy.limit;
  item.count = policy.count;
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
 *   - Populate next period's usage key
 *
 * @param {string} key The key to save to sans prefix.
 * @param {Object} item Key value pairs.
 * @return {Promise(Object)} A promise with the new item.
 * @private
 */
Token.prototype._createItem = function(token, item) {
  var self = this;
  return new Promise(function(resolve, reject) {
    function handleCb(err) {
      if (err) {return reject(err);}
      self.normalizeTokenItem(item);
      resolve(item);
      self.emit(EventBus.Event.CREATE, item);
    }

    var keys = self.getKeys(item);

    // check if token already exists
    self.get(item.token).then(function(tokenItem) {
      if (tokenItem) {
        // it exists
        resolve(tokenItem);
        return self.emit(EventBus.Event.CREATE, tokenItem);
      }

      var startingPoint;
      if (item.count) {
        startingPoint = UsageModel.COUNT_START;
        item.count = '1';
      } else {
        startingPoint = item.limit;
        item.count = '0';
      }

      self.client.multi()
        .hmset(keys.token, item)
        .sadd(keys.index, token)
        .set(keys.usage, startingPoint)
        .set(keys.usageFuture, startingPoint)
        .exec(handleCb);
    });
  });
};

/**
 * Remove a token and all references in an atomic operation.
 *
 * @param {string} token The token to remove.
 * @return {Promise} A promise.
 */
Token.prototype.remove = Promise.method(function(token) {
  this.log.finer('remove() :: Will remove token:', token);

  var self = this;
  // fetch the token first
  return this.get(token).then(function(tokenItem) {
    // check if token item was found (exists).
    if (!self.isTokenItem(tokenItem)) {
      return null;
    }
    self._removeActual(tokenItem);
  });
});

/**
 * The actual remove operation.
 *
 * @param {Object} item The item to remove.
 * @return {Promise} A promise.
 */
Token.prototype._removeActual = function(item) {
  this.normalizeTokenItem(item);

  var self = this;
  return new Promise(function(resolve, reject) {
    function handleCb(err) {
      if (err) {return reject(err);}
      resolve();
      self.emit(EventBus.Event.DELETE, item);
    }

    var keys = self.getKeys(item);

    self.client.multi()
      .del(keys.token)
      .srem(keys.index, item.token)
      .del(keys.usage)
      .del(keys.futureUsage)
      .exec(handleCb);
  });
};

/**
 * Get actual op.
 *
 * @param {string} token The token to fetch.
 * @return {Promise(Object)} A promise with the token Item.
 */
Token.prototype.getActual = Promise.method(function(token) {
  var tokenKey = this.getPrefix() + token;
  var self = this;
  return this.hgetall(tokenKey).then(function(tokenItem) {
    if (__.isObject(tokenItem)) {
      self.normalizeTokenItem(tokenItem);
      var keys = self.getKeys(tokenItem);
      return self.getRedis(keys.usage).then(function(result) {
        if (tokenItem.count) {
          tokenItem.consumed = result - UsageModel.COUNT_START;
        } else {
          tokenItem.remaining = parseInt(result, 10);
        }
        return tokenItem;
      });
    } else {
      return tokenItem;
    }
  });
});

/**
 * Normalize Redis token result object.
 *
 * @param {Object} tokenItem The raw redis object, WARNING mutates.
 * @param {string=} optUsageResult You may define a usage result.
 */
Token.prototype.normalizeTokenItem = function(tokenItem, optUsageResult) {
  tokenItem.count = tokenItem.count === '1';
  if (tokenItem.count) {
    tokenItem.remaining = NaN;
    tokenItem.limit = NaN;
  } else {
    tokenItem.limit = parseInt(tokenItem.limit, 10);
    tokenItem.remaining = optUsageResult || tokenItem.limit;
    tokenItem.consumed = NaN;
  }
};

/**
 * Get all token items by ownerId.
 *
 * @param {string} ownerId The Owner Id.
 * @return {Promise(Array.<Object>)} A promise with the results.
 */
Token.prototype.getByOwnerIdActual = Promise.method(function(ownerId) {
  var indexKey = this.prefix + 'index:' + this.namespace + ':' + ownerId;

  this.log.finer('getByOwnerIdActual() :: Fetching index key:', indexKey);
  var self = this;
  return this.smembers(indexKey).then(function(tokens) {
    self.log.finest('getByOwnerIdActual() :: tokens result:', tokens);
    if (!Array.isArray(tokens)) { return [];}
    if (!tokens.length) { return [];}
    return Promise.map(tokens, self.get);
  });
});

/**
 * Helper to collect proper key names.
 *
 * @param {Object} item The token item.
 * @return {Object} An object with the keys 'usage', 'usageFuture', 'index'.
 */
Token.prototype.getKeys = function(item) {
  var periodBucket = period.get(item.period);
  var periodBucketFuture = period.getFuture(item.period);
  var indexKeyPrefix = this.prefix + 'index:' + this.namespace + ':';

  var keys = {
    token: this.getPrefix() + item.token,
    index: indexKeyPrefix + item.ownerId,
    usage: null,
    usageFuture: null,
  };
  if (item.count) {
    keys.usage = this.prefix + 'usage:' + periodBucket + ':count:' + item.token;
    keys.usageFuture = this.prefix + 'usage:' + periodBucketFuture + ':count:' +
      item.token;
  } else {
    keys.usage = this.prefix + 'usage:' + periodBucket + ':' + item.token;
    keys.usageFuture = this.prefix + 'usage:' + periodBucketFuture + ':' +
      item.token;
  }

  return keys;
};

/**
 * Determines if argument is a valid tokenItem or not.
 *
 * @param {*} tokenItem item to test.
 * @return {boolean} The result.
 */
Token.prototype.isTokenItem = function(tokenItem) {
  if (!__.isObject(tokenItem)) {
    return false;
  }

  if (!__.isString(tokenItem.token)) {
    return false;
  }

  if (!tokenItem.token.length) {
    return false;
  }

  return true;
};
