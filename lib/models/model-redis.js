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
 *   @param {string=} prefix Prefix to use for all keys,
 *     needs to end with colon `:`.
 * @constructor
 * @extends {kansas.Model}
 */
var Redis = module.exports = Model.extend(function(client, opts) {
  this.client = client;
  this.opts = opts;
  /** @type {string} The base namespace to use for storing to redis */
  this.NS = this.opts.prefix || '';
});

/**
 * Wrap redis hmset with promise and returning saved item.
 * 
 * @param {string} key The key to save to sans prefix.
 * @param {Object} item Key value pairs.
 * @return {Promise(Object)} A promise with the new item.
 */
Redis.prototype.hmset = function(key, item) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.client.hmset(self.NS + key, item, function(err) {
        if (err) {return reject(err);}
        resolve(item);
      });
  });
};

/**
 * Wrap redis hget with promise and return results.
 * 
 * @param {string} key The key to save to sans prefix.
 * @return {Promise(Object)} Results.
 */
Redis.prototype.hget = function(key) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.client.hget(self.NS + key, function(err, item) {
        if (err) {return reject(err);}
        resolve(item);
      });
  });
};

/**
 * Wrap redis hdel with promise and return deleted items.
 * 
 * @param {string} key The key to save to sans prefix.
 * @return {Promise(number)} How many items where deleted.
 */
Redis.prototype.hdel = function(key) {
  var self = this;
  return new Promise(function(resolve, reject) {
    self.client.hdel(self.NS + key, function(err, num) {
        if (err) {return reject(err);}
        resolve(num);
      });
  });
};
