/**
 * @fileOverview The tokens model.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');
// var log = require('../util/logger').getLogger('kansas.model.token');

var Model = require('./model-redis');

var helpers = require('../util/helpers');

var Token = module.exports = Model.extend(function() {
  // wire set/del/get
  middlewarify.make(this, 'set', this.hmset.bind(this, ['ownerId']));
  middlewarify.make(this, 'get', this.hdel.bind(this));
  middlewarify.make(this, 'del', this.hget.bind(this, ['ownerId']));

  this.namespace = 'token';
  this.idProp = 'token';
});

/**
 * Will create a new token and return the value.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} policyId The policy id.
 *   @param {string} ownerId Arbitrary string that identifies the owner.
 * @return {Promise(Object)} A promise with the new item.
 */
Token.prototype.create = Promise.method(function(userValues) {
  var item = Object.create(null);
  item.token = helpers.generateRandomString(32);
  item.policyId = userValues.policyId;
  item.ownerId = userValues.ownerId;
  item.createdOn = (new Date()).toISOString();
  return this.set(item.token, item);
});
