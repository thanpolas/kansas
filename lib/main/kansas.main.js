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
var TokenEnt = require('../entities/token.ent');

var TokenCtrl = require('../controllers/token.ctrl');

var kansasRouter = require('../routes/kansas-routes.js');

logger.init();

/**
 * Kansas main module, composes a new set of resources.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 */
var Kansas = module.exports = function() {
  log.fine('Ctor() :: Init');
  /** @type {?express} An express instance */
  this.app = null;

  /** @type {boolean} Indicates active connection to db. */
  this.connected = false;

  /** @type {Object} A dict with options */
  this.options = {};

  // populate options
  this.setup();

  /** @type {?kansas.main.Redis} Instance of Redis connection manager */
  this.conn = null;

  /** @type {?kansas.entity.Token} The token entity instance */
  this.tokenEnt = null;

  /** @type {?Kansas.ctrl.Token} The token controller */
  this.tokenCtrl = null;
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
 * Initialize routes, middleware and controllers for an Express instance.
 *
 * @param {express} app An express instance.
 * @return {Promise} A promise.
 */
Kansas.prototype.express = function(app) {
  var self = this;
  return new Promise(function(resolve, reject) {
    log.finer('express() :: Init. Connected:', self.connected);
    if (!self.connected) {
      return reject('Not connected to db. Use .connect() first');
    }
    self.app = app;

    /** @type {kansas.entity.Token} The token entity instance */
    self.tokenEnt = new TokenEnt(self.conn.tokenModel);

    /** @type {Kansas.ctrl.Token} The token controller */
    self.tokenCtrl = new TokenCtrl();
    self.tokenCtrl.setEntity(self.tokenEnt);

    kansasRouter.init(self);
  });
};

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
