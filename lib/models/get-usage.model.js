/**
 * @fileOverview Model responsible for creating usage reporting.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');

var Model = require('./model-redis');
var period = require('./period-bucket.model');
// var kansasError = require('../util/error');

// function noop() {}

/**
 * Model responsible for creating usage reporting.
 *
 * @constructor
 * @extends {kansas.model.Redis}
 */
var GetUsage = module.exports = Model.extend(function() {
  middlewarify.make(this, 'getUsage', this.getUsageActual.bind(this),
    {beforeAfter: true});
  middlewarify.make(this, 'getUsageByOwnerId',
    this.getUsageByOwnerIdActual.bind(this), {beforeAfter: true});

  /** @type {?kansas.model.Token} An instance of the token model */
  this.tokenModel = null;

  this.get = Promise.promisify(this.client.get, this.client);

  this.namespace = 'usage';
  this.idProp = 'token';
});

/**
 * DI an instance of token model.
 *
 * @param {kansas.model.Token} tokenModel DI an instance of token model.
 */
GetUsage.prototype.setTokenModel = function(tokenModel) {
  this.tokenModel = tokenModel;
};

/**
 * Fetch current usage for provided token.
 *
 * This operation does not need to be performant.
 *
 * @param {string} token then token.
 * @param {Object=} optTokenItem Optionally provide the token item.
 * @return {Promise(number)} A promise with the usage units remaining, negative
 *   values mean the usage limit has been reached.
 */
GetUsage.prototype.getUsageActual = Promise.method(function(token, optTokenItem) {
  var fetchTokenItem;
  if (typeof optTokenItem === 'object') {
    fetchTokenItem = Promise.resolve(optTokenItem);
  } else {
    fetchTokenItem = this.tokenModel.get(token);
  }

  return fetchTokenItem
    .bind(this)
    .then(function(tokenItem) {
      // stub to month for now.
      var bucket = period.get(period.Period.MONTH);
      var key;
      if (tokenItem.count) {
        key = this.getPrefix() + bucket + ':count:' + token;
      } else {
        key = this.getPrefix() + bucket + ':' + token;
      }

      return key;
    })
    .then(this.get);
});

/**
 * Fetch all tokens of user and load usage for each one.
 *
 * @param {string} ownerId The user id.
 * @return {Promise(Array.<Object>)} An array of Token Items augmented with
 *   the 'usage' attribute.
 */
GetUsage.prototype.getUsageByOwnerIdActual = Promise.method(function(ownerId) {
  return this.tokenModel.getByOwnerId(ownerId)
    .bind(this)
    .map(function(tokenItem) {
      return this.getUsageActual(tokenItem.token, tokenItem)
        .then(function(usage) {
          tokenItem.usage = usage;
          return tokenItem;
        });
    });
});
