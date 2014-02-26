/**
 * @fileOverview Owners accounting methods, swithing policies.
 */
var Promise = require('bluebird');
var log = require('../util/logger').getLogger('kansas.model.Accounting');

var Model = require('./model');

var Accounting = module.exports = Model.extend(function() {
  
  /** @type {?kansas.model.Token} An instance of the token model */
  this.tokenModel = null;

  this.method('changePolicy', this._changePolicy.bind(this));
});

/**
 * DI an instance of token model.
 * 
 * @param {kansas.model.Token} tokenModel DI an instance of token model.
 */
Accounting.prototype.setTokenModel = function(tokenModel) {
  this.tokenModel = tokenModel;
  this.changePolicy.before(this.tokenModel.validatePolicy);
};

/**
 * Will Change the policy on all tokens of an existing owner.
 *
 * @param {Object} params Parameters object with the following keys:
 *   @param {string} ownerId the owner's id.
 *   @param {string} policyName The new policy name.
 * @return {Promise} A promise.
 */
Accounting.prototype.changePolicy = Promise.method(function(params) {

  return this.tokenModel.getByOwnerId(params.ownerId).then(function(res) {
    if (!Array.isArray(res) || !res.length) {
      log.fine('changePolicy() :: Owner had no tokens. Owner id:', params.ownerId);
      // no tokens found for this owner.
      return;
    }

    return Promise.map(res, this._changePolicyActual.bind(this, params));
  });
});

/**
 * The actual atomic operation.
 *
 * @param {Object} params Parameters object with the following keys:
 *   @param {string} ownerId the owner's id.
 *   @param {string} policyName The new policy name.
 * @param {Object} tokenItem The token item.
 * @return {Promise} A promise.
 */
Accounting.prototype._changePolicyActual = function(params, tokenItem) {
  var keys = this.tokenModel.getKeys(tokenItem);
  var self = this;
  var policy = this.tokenModel.policy.get(params.policyName);

  return new Promise(function(resolve, reject) {
    function handleCb(err) {
      if (err) {return reject(err);}
      resolve();
    }

    var newTokenValues = {
      policyName: params.policyName,
      period: policy.period,
      limit: policy.limit,
    };
    self.multi()
      .hmset(keys.token, newTokenValues)
      .set(keys.usage, policy.limit)
      .set(keys.usageFuture, policy.limit)
      .exec(handleCb);
  });

};
