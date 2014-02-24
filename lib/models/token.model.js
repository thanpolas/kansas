/**
 * @fileOverview The tokens model.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');
// var log = require('../util/logger').getLogger('kansas.model.token');

var Model = require('./model-redis');

var helpers = require('../util/helpers');
var kansasError = require('../util/error');

var Token = module.exports = Model.extend(function() {
  // wire set/del/get
  middlewarify.make(this, 'set', this.create.bind(this));
  middlewarify.make(this, 'get', this.hdel.bind(this));
  middlewarify.make(this, 'del', this.hget.bind(this, ['ownerId']));

  this.namespace = 'token';
  this.idProp = 'token';

  /** @type {?kansas.model.Policy} An instance of Policy model */
  this.policy = null;
});

/**
 * Set the policy instance to use.
 *
 * @param {kansas.model.Policy} policy The Policy model instance.
 */
Token.prototype.setPolicy = function (policy) {
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

  if (!this.policy.has(userValues.policyName)) {
    var err = new kansasError.Policy('Policy with name "' +
      userValues.policyName + '" not found!');
    err.type = kansasError.Policy.Type.NOT_FOUND;
    throw err;
  }

  var policy = this.policy.get(userValues.policyName);

  var item = Object.create(null);
  item.token = helpers.generateRandomString(32);
  item.policyName = policy.policyName;
  item.limit = policy.limit;
  item.period = policy.period;
  item.ownerId = userValues.ownerId;
  item.createdOn = (new Date()).toISOString();
  return this._createItem(item.token, item);
});

/**
 * Save a token item and create an index for ownerId.
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

    var transaction = self.client.multi()
      .hmset(self.getPrefix() + token, item);

    var indexKeyPrefix = self.prefix + 'index:' + self.namespace + ':';
    var indexValue = item.ownerId;
    var indexKey = indexKeyPrefix + indexValue;
    transaction = transaction.sadd(indexKey, token);

    transaction.exec(handleCb);
  });
};
