/**
 * @fileOverview The Usage model.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');

// var logger = require('../main/logger.main');

var Model = require('./model-redis');
var EventBus = require('../main/event-bus.main');
var period = require('./period-bucket.model');
var kansasError = require('../util/error');

function noop() {}

/**
 * The Usage model.
 *
 * @constructor
 * @extends {kansas.model.Redis}
 */
var Usage = module.exports = Model.extend(function() {
  middlewarify.make(this, 'consume', this.consumeActual.bind(this),
    {beforeAfter: true});
  middlewarify.make(this, 'count', this.countActual.bind(this),
    {beforeAfter: true});

  this.decr = Promise.promisify(this.client.decr, this.client);
  this.decrby = Promise.promisify(this.client.decrby, this.client);
  this.incr = Promise.promisify(this.client.incr, this.client);
  this.incrby = Promise.promisify(this.client.incrby, this.client);
  this.namespace = 'usage';
  this.idProp = 'token';
});

/**
 * The count start represents the starting point of the keys that
 * the INCR operation executes on. It is required because if we initialize
 * known tokens with the value "0", after the first INCR op happens,
 * there is no way of knowing if the token-key existed or not.
 *
 * If the key did not exist INCR will set it to 0 before performing the op
 * returning "1". So if our starting point is "1" we can be sure that when
 * INCR returns "1" it means that they key did not exist thus the token
 * is not valid.
 *
 * @const {number}
 */
Usage.COUNT_START = 1;

/**
 * Will consume a unit from a token.
 *
 * @param {string} token then token.
 * @param {number=} optUnits how many units to consume, default 1.
 * @return {Promise(number)} A promise with the usage units remaining, negative
 *   values mean the usage limit has been reached a rejection of Error type
 *   kansas.error.TokenNotExists
 */
Usage.prototype.consumeActual = Promise.method(function(token, optUnits) {
  // stub to month for now.
  var bucket = period.get(period.Period.MONTH);
  var key = this.getPrefix() + bucket + ':' + token;
  var decrPromise;
  var consumed = 1;
  var self = this;
  if (typeof optUnits === 'number' && optUnits > 1) {
    consumed = optUnits;
    decrPromise = this.decrby(key, optUnits).then(function(res) {
      return self._checkConsumeResult(token, res);
    });
  } else {
    decrPromise = this.decr(key).then(function(res) {
      return self._checkConsumeResult(token, res);
    });
  }

  // propagate event
  decrPromise.fork(function(res) {
    self.emit(EventBus.Event.CONSUME, token, consumed, res);
  })
    .catch(noop);

  return decrPromise;
});

/**
 * Will check the result of DECR, if negative will check if token even exists.
 *
 * @param {string} token then token.
 * @param {number} remaining usage units remaining.
 * @return {Promise(number)} A promise with the usage units remaining, negative
 *   values mean the usage limit has been reached.
 * @private
 */
Usage.prototype._checkConsumeResult = Promise.method(function(token, remaining) {
  if (remaining >= 0) {
    return remaining;
  }

  // not there, need to check if token exists
  var tokenKey = this.prefix + 'token:' + token;
  return this.exists(tokenKey).then(function(result) {
    if (result) {
      throw new kansasError.UsageLimit();
    } else {
      throw new kansasError.TokenNotExists();
    }
  });
});

/**
 * Will increase and count a unit from a token.
 *
 * @param {string} token then token.
 * @param {number=} optUnits how many units to consume, default 1.
 * @return {Promise(number)} A promise with the units used.
 */
Usage.prototype.countActual = Promise.method(function(token, optUnits) {
  // stub to month for now.
  var bucket = period.get(period.Period.MONTH);
  var key = this.getPrefix() + bucket + ':count:' + token;
  var incrPromise;
  var count = 1;
  var self = this;
  if (typeof optUnits === 'number' && optUnits > 1) {
    count = optUnits;
    incrPromise = this.incrby(key, count).then(function(res) {
      return self._checkCountResult(key, count, res);
    });
  } else {
    incrPromise = this.incr(key).then(function(res) {
      return self._checkCountResult(key, count, res);
    });
  }

  // propagate event
  incrPromise.fork(function(res) {
    self.emit(EventBus.Event.CONSUME, token, count, res);
  }).catch(noop);

  return incrPromise;
});


/**
 * Will check the result of INCR, if "1" will check if token even exists.
 *
 * @see Usage.COUNT_START
 * @param {string} key The usage key used.
 * @param {number} count How many units where used in the INCR operation.
 * @param {number} consumed usage units consumed.
 * @return {Promise(number)} A promise with the usage units consumed.
 * @private
 */
Usage.prototype._checkCountResult = Promise.method(function(key, count, consumed) {
  if ((consumed - count) >= 1) {
    return consumed - Usage.COUNT_START;
  }

  // At this point we know the token does not exist
  // The created token must be deleted
  return this.del(key).then(function() {
    throw new kansasError.TokenNotExists();
  });
});
