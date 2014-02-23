/**
 * @fileOverview The Usage model.
 */
var Promise = require('bluebird');
var middlewarify = require('middlewarify');
// var log = require('../util/logger').getLogger('kansas.model.usage');

var Model = require('./model-redis');

var Token = module.exports = Model.extend(function() {
  // wire set/del/get
  middlewarify.make(this, 'set', this.hmset.bind(this, []));
  middlewarify.make(this, 'get', this.hdel.bind(this));
  middlewarify.make(this, 'del', this.hget.bind(this, []));

  this.namespace = 'usage';
  this.idProp = 'token';
});

/**
 * Will create a new policy and return the value.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} name The policy name.
 *   @param {integer} maxTokens Maximum number of tokens.
 *   @param {integer} limit Maximum requests limit per given period (now only month).
 * @return {Promise(Object)} A promise with the new item.
 */
Token.prototype.create = Promise.method(function(userValues) {
  var item = Object.create(null);
  item.name = userValues.name;
  item.maxTokens = userValues.maxTokens;
  item.limit = userValues.limit;
  item.createdOn = (new Date()).toISOString();
  return this.set(item.token, item);
});
