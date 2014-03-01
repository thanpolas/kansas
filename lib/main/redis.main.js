/*jshint camelcase:false */
/**
 * @fileOverview The redis connection manager.
 */
var EventEmitter = require('events').EventEmitter;

var cip = require('cip');
var Promise = require('bluebird');
var redis = require('redis');
var __ = require('lodash');
var logger = require('./logger.main');
var kansasError = require('../util/error');

var CeventEmitter = cip.cast(EventEmitter);

/**
 * The base Model Class redis models extend from.
 *
 * @event `error` When an error surfaces up from redis.
 *
 * @param {Object=} optOpts A dict with the following options:
 *   @param {string=} port The port.
 *   @param {string=} host The hostname.
 *   @param {string=} pass The password.
 *   @param {Object=} redisOptions Any redis options.
 *
 * @extents {events.EventEmitter}
 * @constructor
 */
var Redis = module.exports = CeventEmitter.extend(function(optOpts) {
  var opts = optOpts || {};

  this.log = logger.getLogger('kansas.main.redis');

  /** @type {?redis.Client} The redis client */
  this.client = null;

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
  this.log.finer('getClient() :: Init.');

  if (this.client) {
    return this.client;
  }

  var port = this.opts.port;
  var host = this.opts.host;
  var pass = this.opts.pass;
  var redisOptions = this.opts.redisOptions;

  this.log.finer('getClient() :: Creating client using host, port:', host, port);
  try {
    this.client = redis.createClient(port, host, redisOptions);
  } catch(ex) {
    this.log.error('getClient() :: Failed to create redis connection. Err: ', ex);
    return null;
  }

  if ( __.isString( pass ) ) {
    this.client.auth( pass );
  }

  this.client.on('error', this._onRedisError.bind(this));

  return this.client;
};

/**
 * Logs the error and emits it.
 *
 * @param  {string} err the error message
 */
Redis.prototype._onRedisError = function(err) {
  this.log.fine('_onRedisError() :: ', err.message, err);
  this.emit(err);
};

/**
 * Perform a connection to redis
 *
 * @return {Promise(redis.RedisClient)} A promise offering a redis client.
 */
Redis.prototype.connect = function() {
  if (this.client) {
    return Promise.resolve(this.client);
  }
  var self = this;
  return new Promise(function(resolve, reject) {
    this.log.fine('connect() :: Connect to Redis...');

    var client = self.getClient();

    function onConnect() {
      client.removeListener('error', onError);
      resolve(client);
    }
    function onError(err) {
      client.removeListener('connect', onConnect);
      var error = new kansasError.Database(err);
      error.type = kansasError.Database.Type.REDIS_CONNECTION;
      reject(error);
    }

    client.once('connect', onConnect);
    client.once('error', onError);
  });
};
