/*jshint camelcase:false */
/**
 * @fileOverview The base Model Class redis models extend from.
 */
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
module.exports = Model.extend(function(client, opts) {
  this.client = client;
  this.opts = opts;
  /** @type {string} The base namespace to use for storing to redis */
  this.NS = this.opts.prefix || '';
});
