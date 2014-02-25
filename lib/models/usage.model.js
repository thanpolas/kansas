/**
 * @fileOverview The Usage model.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');

// var log = require('../util/logger').getLogger('kansas.model.usage');

var Model = require('./model-redis');
var period = require('./period-bucket.model');
var kansasError = require('../util/error');

var Usage = module.exports = Model.extend(function() {
  this.namespace = 'usage';
  this.idProp = 'token';
});

/**
 * Will consume a unit from a token.
 *
 * @param {string} token then token.
 * @return {Promise(number)} A promise with the usage units remaining, negative
 *   values mean the usage limit has been reached a rejection of Error type
 *   kansas.error.TokenNotExists
 */
Usage.prototype.consume = Promise.method(function(token) {
  // stub to month for now.
  var bucket = period.get(period.Period.MONTH);
  var key = this.getPrefix() + bucket + ':' + token;
  return this.decr(key).then(this._checkConsumeResult.bind(this, token));
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
  if (remaining > 0) {
    return remaining;
  }

  // not there, need to check if token exists
  var tokenKey = this.prefix + 'token:' + token;

  return this.exists(tokenKey).then(function(result) {
    if (result) {
      return remaining;
    } else {
      throw(new kansasError.TokenNotExists());
    }
  });
});
