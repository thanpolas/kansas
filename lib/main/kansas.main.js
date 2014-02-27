/**
 * @fileOverview Kansas main module, instanciates a new set of resources.
 */
var __ = require('lodash');
var Promise = require('bluebird');
var redis = require('redis');
require('redis-scanstreams')(redis);

var logger = require('../util/logger');
var log = logger.getLogger('kansas.main.Kansas');
var kansasError = require('../util/error');
// add scan streams https://github.com/brycebaril/redis-scanstreams
var Redis = require('./redis.main');

logger.init();

/**
 * Kansas main module, composes a new set of resources.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 */
var Kansas = module.exports = function(optOptions) {
  log.fine('Ctor() :: Init');
  /** @type {boolean} Indicates active connection to db. */
  this.connected = false;

  /** @type {Object} A dict with options */
  this.options = {};

  // populate options
  this.setup(optOptions);

  /** @type {?kansas.main.Redis} Instance of Redis connection manager */
  this.conn = null;

  // token methods
  this.create = null;
  this.set = null;
  this.get = null;
  this.getByOwnerId = null;
  this.del = null;
  this.changePolicy = null;
  this.consume = null;
  this.tokenModel = null;

  // policy methods
  this.policy = {
    create: null,
    set: null,
    get: null,
    del: null,
    model: null,
  };

  // DB Maintenance
  this.db = {
    prepopulate: null,
    nuke: null,
  };

  // error objects
  this.error = kansasError;
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
