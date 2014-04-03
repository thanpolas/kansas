/**
 * @fileOverview Owners accounting methods, swithing policies.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');
var logger = require('../main/logger.main');

var Model = require('./model-redis');
var EventBus = require('../main/event-bus.main');
var UsageModel = require('./usage.model');

/**
 * Owners accounting methods, switches policies.
 *
 * @constructor
 * @extends {kansas.model.Redis}
 */
var Accounting = module.exports = Model.extend(function() {
  this.log = logger.getLogger('kansas.model.Accounting');

  /** @type {?kansas.model.Token} An instance of the token model */
  this.tokenModel = null;

  middlewarify.make(this, 'changePolicy', this._changePolicy.bind(this),
    {beforeAfter: true});
});

/**
 * DI an instance of token model.
 *
 * @param {kansas.model.Token} tokenModel DI an instance of token model.
 */
Accounting.prototype.setTokenModel = function(tokenModel) {
  this.tokenModel = tokenModel;
  this.changePolicy.before(this.tokenModel.validatePolicy.bind(this.tokenModel));
};

/**
 * Will Change the policy on all tokens of an existing owner.
 *
 * @param {Object} params Parameters object with the following keys:
 *   @param {string} ownerId the owner's id.
 *   @param {string} policyName The new policy name.
 * @return {Promise} A promise.
 * @protected
 */
Accounting.prototype._changePolicy = Promise.method(function(params) {
  var self = this;
  return this.tokenModel.getByOwnerId(params.ownerId).then(function(res) {
    if (!Array.isArray(res) || !res.length) {
      self.log.fine('changePolicy() :: Owner had no tokens. Owner id:', params.ownerId);
      // no tokens found for this owner.
      return;
    }

    return Promise.map(res, self._changePolicyActual.bind(self, params))
      // fork event emission
      .fork(function() {
        var policyItem = self.tokenModel.policy.get(params.policyName);
        self.emit(EventBus.Event.POLICY_CHANGE, params, policyItem);
      });
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
 * @protected
 */
Accounting.prototype._changePolicyActual = function(params, tokenItem) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var keys = self.tokenModel.getKeys(tokenItem);
    var policy = self.tokenModel.policy.get(params.policyName);
    function handleCb(err) {
      if (err) {return reject(err);}
      resolve();
    }

    var newTokenValues = {
      policyName: params.policyName,
      period: policy.period,
      limit: policy.limit,
      count: policy.count,
    };

    var startingPoint;
    if (policy.count) {
      startingPoint = UsageModel.COUNT_START;
    } else {
      startingPoint = policy.limit;
    }

    self.client.multi()
      .hmset(keys.token, newTokenValues)
      .set(keys.usage, startingPoint)
      .set(keys.usageFuture, startingPoint)
      .exec(handleCb);
  });
};
