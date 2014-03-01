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

  this.decr = Promise.promisify(this.client.decr, this.client);
  this.decrby = Promise.promisify(this.client.decrby, this.client);
  this.namespace = 'usage';
  this.idProp = 'token';
});

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
  if (typeof optUnits === 'number' && optUnits !== 0) {
    consumed = optUnits;
    decrPromise = this.decrby(key, optUnits)
      .then(this._checkConsumeResult.bind(this, token));
  } else {
    decrPromise = this.decr(key).then(this._checkConsumeResult.bind(this, token));
  }

  decrPromise.fork(this.emit.bind(this, EventBus.Event.CONSUME, token, consumed))
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
