/**
 * @fileOverview Kansas main module, instanciates a new set of resources.
 */
var __ = require('lodash');
var Promise = require('bluebird');
var logger = require('../util/logger');
var log = logger.getLogger('kansas.main.Kansas');

var ConnMongo = require('./db-connection.main');
var ApplicationEnt = require('../entities/application.ent');
var TokenEnt = require('../entities/token.ent');

var ApplicationCtrl = require('../controllers/application.ctrl');
var TokenCtrl = require('../controllers/token.ctrl');

var kansasRouter = require('../routes/kansas-routes.js');

logger.init();

/**
 * Kansas main module, composes a new set of resources.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 */
var Kansas = module.exports = function(optOptions) {
  log.fine('Ctor() :: Init');
  /** @type {?express} An express instance */
  this.app = null;

  /** @type {boolean} Indicates active connection to db. */
  this.connected = false;

  /** @type {Object} A dict with options */
  this.options = this._handleOptions(optOptions);

  /** @type {kansas.main.ConnectionMongo} Instance of mongo connection */
  this.conn = new ConnMongo(this.options.mongo);

  /** @type {?kansas.entity.Application} The app entity instance */
  this.appEnt = null;
  /** @type {?kansas.entity.Token} The token entity instance */
  this.tokenEnt = null;

  /** @type {?Kansas.ctrl.Application} The app controller */
  this.appCtrl = null;
  /** @type {?Kansas.ctrl.Token} The token controller */
  this.tokenCtrl = null;
};

/**
 * Initiate database connections and models.
 *
 * @return {Promise} A promise.
 */
Kansas.prototype.connect = function() {
  log.finer('connect() :: Init... Connected:', this.connected);
  if (this.connected) {
    return Promise.resolve();
  }

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
};

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

    /** @type {kansas.entity.Application} The app entity instance */
    self.appEnt = new ApplicationEnt(self.conn.appModel);
    /** @type {kansas.entity.Token} The token entity instance */
    self.tokenEnt = new TokenEnt(self.conn.tokenModel);

    /** @type {Kansas.ctrl.Application} The app controller */
    self.appCtrl = new ApplicationCtrl();
    self.appCtrl.setEntity(self.appEnt);
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
 * @private
 */
Kansas.prototype._handleOptions = function(optOptions) {
  var defaultValues = {
    routePrefix: '',
    mongo: {
      user: null,
      password: null,
      database: 'kansas',
      hostname: 'localhost',
      reconnectTime: 500,
    },

  };
  var userOpts = {};
  if (__.isObject(optOptions)) {
    userOpts = optOptions;
  }
  return __.defaults(userOpts, defaultValues);
};
