/*jshint camelcase:false */
/**
 * @fileOverview The base Model Class redis models extend from.
 */
var Promise = require('bluebird');

// var log = require('logg').getLogger('kansas.model.Redis');

var Model = require('./model');

/**
 * The base Model Class redis models extend from.
 *
 * @param {redis.RedisClient} client The redis client to use.
 * @param {Object} opts A dict with the following options:
 *   @param {string=} prefix Prefix to use for all keys.
 * @constructor
 * @extends {kansas.Model}
 */
var Redis = module.exports = Model.extend(function(client, opts) {
  this.client = client;
  this.opts = opts;
  /** @type {string} The base namespace to use for storing to redis */
  this.prefix = '';

  if (typeof this.opts.prefix === 'string' && this.opts.prefix.length) {
    this.prefix += this.opts.prefix + ':';
  }

  // sign
  this.prefix += 'kansas:';

  /** @type {string} Set by each ancestor indicates the store's name */
  this.namespace =  '';

  /** @type {string} Set by each ancestor indicates the id field if type is hash */
  this.idProp = '';

  // Promisify commonly used redis functions
  this.incr = Promise.promisify(this.client.incr, this.client);
  this.del = Promise.promisify(this.client.del, this.client);
  this.decr = Promise.promisify(this.client.decr, this.client);
  this.hmget = Promise.promisify(this.client.hmget, this.client);
  this.hgetall = Promise.promisify(this.client.hgetall, this.client);
  this.exists = Promise.promisify(this.client.exists, this.client);
});

/**
 * Returns properly composed prefix to use as key on redis.
 *
 * @return {string} prefix key.
 */
Redis.prototype.getPrefix = function() {
  return this.prefix + this.namespace + ':';
};

/**
 * Get a new unique id.
 *
 * @return {Promise(string)} A unique id
 */
Redis.prototype.uniqueId = function() {
  return this.incr(this.getPrefix() + 'id');
};

/**
 * Perform multiple concurent exists() calls.
 *
 * @param {Array.<string>} keys Keys to examine if they exist.
 * @return {Promise(Array.<number>)} Results of exists.
 */
Redis.prototype.existsAll = function(keys) {
  var self = this;
  return Promise.map(keys, function(item) {
    return self.exists(item);
  });
};
