/*jshint camelcase:false */
/**
 * @fileOverview The redis connection manager.
 */
var EventEmitter = require('events').EventEmitter;

var cip = require('cip');
var Promise = require('bluebird');
var redis = require('redis');
var __ = require('lodash');
var log = require('logg').getLogger('kansas.main.redis');

var CeventEmitter = cip.cast(EventEmitter);

/**
 * The base Model Class redis models extend from.
 *
 * @event `error` When an error surfaces up from redis.
 *
 * @param {Object} opts A dict with the following options:
 *   @param {string} port The port.
 *   @param {string} host The hostname.
 *   @param {string=} pass The password.
 *   @param {Object=} redisOptions Any redis options.
 *
 * @extents {events.EventEmitter}
 * @constructor
 */
var Redis = module.exports = CeventEmitter.extend(function(opts) {
  this.opts = {
    port: opts.port || 6379,
    host: opts.host || 'localhost',
    pass: opts.pass,
    redisOptions: opts.redisOptions,
  };

});

/**
 * Initializes a redis client and provides it.
 *
 * @return {redis.RedisClient} A redis client.
 */
Redis.prototype.getClient = function() {
  log.finer('getClient() :: Init.');

  var port = this.opts.port;
  var host = this.opts.host;
  var pass = this.opts.pass;
  var redisOptions = this.opts.redisOptions;
  var client;

  log.finer('getClient() :: Creating client using host, port:', host, port);
  try {
    client = redis.createClient(port, host, redisOptions);
  } catch(ex) {
    log.error('getClient() :: Failed to create redis connection. Err: ', ex);
    return null;
  }

  if ( __.isString( pass ) ) {
    client.auth( pass );
  }

  client.on('error', this._onRedisError.bind(this));

  return client;
};

/**
 * Logs the error and emits it.
 *
 * @param  {string} err the error message
 */
Redis.prototype._onRedisError = function(err) {
  log.fine('_onRedisError() :: ', err.message, err);
  this.emit(err);
};

/**
 * Perform a connection to redis
 *
 * @return {Promise(redis.RedisClient)} A promise offering a redis client.
 */
Redis.prototype.connect = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    log.fine('connect() :: Connect to Redis...');

    var client = self.getClient();

    function onConnect() {
      client.removeListener('error', onError);
      resolve(client);
    }
    function onError(err) {
      client.removeListener('connect', onConnect);
      reject(err);
    }

    client.once('connect', onConnect);
    client.once('error', onError);
  });
};
