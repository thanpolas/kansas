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
  this.prefix = this.opts.prefix || '';

  /** @type {string} Set by each ancestor indicates the store's name */
  this.namespace =  '';

  /** @type {string} Set by each ancestor indicates the id field if type is hash */
  this.idProp = '';
});

/**
 * Wrap redis hmset with promise and returning saved item.
 *
 * @param {Array} indexes optionally define indexes or empty array.
 * @param {string} key The key to save to sans prefix.
 * @param {Object} item Key value pairs.
 * @return {Promise(Object)} A promise with the new item.
 */
Redis.prototype.hmset = function(indexes, key, item) {
  var self = this;
  return new Promise(function(resolve, reject) {
    function handleCb(err) {
      if (err) {return reject(err);}
      resolve(item);
    }

    if (indexes.length) {
      var transaction = self.client.multi()
        .hmset(self.NS + key, item);

      var indexKeyPrefix = self.NS + 'index:' + this.namespace + ':';
      indexes.forEach(function(index) {
        var indexValue = item[index];
        var indexKey = indexKeyPrefix + indexValue;
        transaction = transaction.set(indexKey, item[this.idProp]);
      });

      transaction.exec(handleCb);
    } else {
      self.client.hmset(self.NS + key, item, handleCb);
    }
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
 * @param {Array} indexes optionally define indexes or empty array.
 * @param {string} key The key to save to sans prefix.
 * @return {Promise(number)} How many items where deleted.
 */
Redis.prototype.hdel = function(indexes, key) {
  var hasIndex = !!indexes.length;

  var self = this;
  return new Promise(function(resolve, reject) {
    function handleCb(err, res) {
      if (err) {return reject(err);}
      var num = hasIndex ? res[0] : res;
      resolve(num);
    }

    if (hasIndex) {
      // need to perform a get to read the index values
      this.hget(key)
        .then(this._hdelWithIndex.bind(this, indexes, key))
        .then(resolve, reject);
    } else {
      self.client.hdel(self.NS + key, handleCb);
    }
  });
};

/**
 * Perform an hdel including indexes, performs a get to read the values
 * of the indexed items so they index keys can be deleted.
 *
 * @param {Array} indexes optionally define indexes or empty array.
 * @param {string} key The key to save to sans prefix.
 * @param {Object} item Key value pairs.
 * @return {Promise(number)} How many items where deleted.
 */
Redis.prototype._hdelWithIndex = function(indexes, key, item) {
  var self = this;
  return new Promise(function(resolve, reject) {
    var transaction = self.client.multi()
      .hdel(self.NS + key);

    var indexKeyPrefix = self.NS + 'index:' + this.namespace + ':';
    indexes.forEach(function(index) {
      var indexValue = item[index];
      var indexKey = indexKeyPrefix + indexValue;
      transaction = transaction.del(indexKey, item[this.idProp]);
    });

    transaction.exec(function(err, res) {
      if (err) {
        return reject(err);
      }
      resolve(res[0]);
    });
  });
};
