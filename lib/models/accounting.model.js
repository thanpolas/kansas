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
  return this.tokenModel.getByOwnerId(params.ownerId)
    .bind(this)
    .then(function(res) {
      if (!Array.isArray(res) || !res.length) {
        this.log.fine('changePolicy() :: Owner had no tokens. Owner id:', params.ownerId);
        // no tokens found for this owner.
        return;
      }

      return Promise.map(res, this._changePolicyActual.bind(this, params));
    })
    .tap(function() {
      var policyItem = this.tokenModel.policy.get(params.policyName);
      this.emit(EventBus.Event.POLICY_CHANGE, params, policyItem);
    });

});

/**
 * The actual atomic operation.
 *
 * @param {Object} params Parameters object with the following keys:
 *   @param {string} ownerId the owner's id.
 *   @param {string} policyName The new policy name.
 * @param {Object} tokenItem The token item, raw from redis.
 * @return {Promise} A promise.
 * @protected
 */
Accounting.prototype._changePolicyActual = function(params, tokenItem) {
  var self = this;
  this.log.fine('_changePolicyActual() :: Changing Policy for:', tokenItem.token,
    'new policy:', params.policyName);
  return new Promise(function(resolve, reject) {

    self.tokenModel.normalizeTokenItem(tokenItem);

    var policy = self.tokenModel.policy.get(params.policyName);

    // overwrite token item count so the correct keys are fetched
    tokenItem.count = policy.count;
    var keys = self.tokenModel.getKeys(tokenItem);

    function handleCb(err) {
      if (err) {return reject(err);}
      resolve();
    }

    var newTokenValues = {
      policyName: params.policyName,
      period: policy.period,
      limit: policy.limit,
      count: ( policy.count ? '1' : '0' ),
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
