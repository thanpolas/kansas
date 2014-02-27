/**
 * @fileOverview Kansas main module, instanciates a new set of resources.
 */
var __ = require('lodash');
var Promise = require('bluebird');
var logger = require('../util/logger');
var log = logger.getLogger('kansas.main.Kansas');

var redis = require('redis');
// add scan streams https://github.com/brycebaril/redis-scanstreams
require('redis-scanstreams')(redis);

var Redis = require('./redis.main');

logger.init();

/**
 * Kansas main module, composes a new set of resources.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 */
var Kansas = module.exports = function() {
  log.fine('Ctor() :: Init');
  /** @type {boolean} Indicates active connection to db. */
  this.connected = false;

  /** @type {Object} A dict with options */
  this.options = {};

  // populate options
  this.setup();

  /** @type {?kansas.main.Redis} Instance of Redis connection manager */
  this.conn = null;

};

/**
 * Initiate database connections and boot models.
 *
 * @return {Promise} A promise.
 */
Kansas.prototype.connect = Promise.method(function() {
  log.finer('connect() :: Init... Connected:', this.connected);
  if (this.connected) {
    return;
  }

  this.conn = new Redis(this.options.redis);

  var self = this;
  return this.conn.connect()
    .then(function() {
      log.finer('connect() :: Done');
      self.connected = true;
    })
    .catch(function(err) {
      log.error('connect() :: Failed to connect to MongoDB:', err);
      throw err;
    });
});

/**
 * Define default options and apply user defined ones.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 */
Kansas.prototype.setup = function(optOptions) {
  var defaultValues = {
    routePrefix: '',
    redis: {
      port: 6379,
      host: 'localhost',
      pass: null,
      redisOptions: null,
    },
  };
  var userOpts = {};
  if (__.isObject(optOptions)) {
    userOpts = optOptions;
  }

  this.options = __.defaults(userOpts, defaultValues);
};
