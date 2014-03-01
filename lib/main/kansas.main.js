/**
 * @fileOverview Kansas main module, instanciates a new set of resources.
 */
var __ = require('lodash');
var Promise = require('bluebird');
var redis = require('redis');
// add scan streams https://github.com/brycebaril/redis-scanstreams
require('redis-scanstreams')(redis);

var logger = require('../util/logger');
var log = logger.getLogger('kansas.main.Kansas');
var kansasError = require('../util/error');
var Redis = require('./redis.main');

var EventBus = require('./event-bus.main');
var TokenModel = require('../models/token.model');
var AccountingModel = require('../models/accounting.model');
var PolicyModel = require('../models/policy.model');
var UsageModel = require('../models/usage.model');

var Populate = require('../db/populate.db');
var Clean = require('../db/clean.db');

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
  this._options = {};

  // populate options
  this.setup(optOptions);

  /** @type {?kansas.main.Redis} Instance of Redis connection manager */
  this.conn = null;

  /** @type {kansas.main.EventBus} The main eventbus */
  this.eventBus = new EventBus();

  /** @type {Function} expose.on method */
  this.on = this.eventBus.on.bind(this.eventBus);

  // token methods
  this.create = null;
  this.set = null;
  this.get = null;
  this.getByOwnerId = null;
  this.del = null;
  this.consume = null;
  this.tokenModel = null;

  // policy methods
  this.policy = {
    create: null,
    get: null,
    has: null,
    model: null,
    change: null,
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

  return this.conn.connect()
    .then(this._onConnect.bind(this))
    .catch(function(err) {
      log.error('connect() :: Failed to connect to Redis:', err);
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
    prefix: '',
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

  this._options = __.defaults(userOpts, defaultValues);
};

/**
 * Trigger on connect and populate exported API.
 *
 * @param {redis.RedisClient} client The redis client.
 * @private
 */
Kansas.prototype._onConnect = function(client) {
  log.finer('_onConnect() :: Done');
  this.connected = true;

  // Boot models
  this.policy.model = new PolicyModel();
  this.tokenModel = new TokenModel(client, {prefix: this._options.prefix});
  this.tokenModel.setPolicy(this.policy.model);

  this.usageModel = new UsageModel(client, {prefix: this._options.prefix});
  this.accountingModel = new AccountingModel(client, {prefix: this._options.prefix});
  this.accountingModel.setTokenModel(this.tokenModel);

  this.populateModel = new Populate(client, {prefix: this._options.prefix});
  this.cleanModel = new Clean(client, {prefix: this._options.prefix});

  // bind methods
  this.create = this.tokenModel.set;
  this.set = this.tokenModel.set;
  this.get = this.tokenModel.get;
  this.getByOwnerId = this.tokenModel.getByOwnerId;
  this.del = this.tokenModel.del;

  this.consume = this.usageModel.consume;

  // policy methods
  this.policy.change = this.accountingModel.changePolicy;
  this.policy.create = this.policy.model.create.bind(this.policy.model);
  this.policy.get = this.policy.model.get.bind(this.policy.model);
  this.policy.has = this.policy.model.has.bind(this.policy.model);

  // DB Maintenance
  this.db = {
    prepopulate: this.populateModel.prepopulate.bind(this.populateModel),
    nuke: this.cleanModel.nuke.bind(this.cleanModel),
  };

};
