/**
 * @fileOverview Kansas main module, instanciates a new set of resources.
 */
var __ = require('lodash');

var ConnMongo = require('./db-connection.main');
var ApplicationEnt = require('../entities/application.ent');
var TokenEnt = require('../entities/token.ent');

var ApplicationCtrl = require('../controllers/application.ctrl');
var TokenCtrl = require('../controllers/token.ctrl');

var kansasRouter = require('../routes/kansas-routes.js');

/**
 * Kansas main module, composes a new set of resources.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 */
var Kansas = module.exports = function(optOptions) {

  /** @type {?express} An express instance */
  this.app = null;

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
  return this.conn.connect();
};

/**
 * Initialize routes, middleware and controllers for an Express instance.
 *
 * @param {express} app An express instance.
 * @return {Promise} A promise.
 */
Kansas.prototype.express = function(app) {
  this.app = app;

  /** @type {kansas.entity.Application} The app entity instance */
  this.appEnt = new ApplicationEnt(this.conn.appModel);
  /** @type {kansas.entity.Token} The token entity instance */
  this.tokenEnt = new TokenEnt(this.conn.tokenModel);

  /** @type {Kansas.ctrl.Application} The app controller */
  this.appCtrl = new ApplicationCtrl();
  this.appCtrl.setEntity(this.appEnt);
  /** @type {Kansas.ctrl.Token} The token controller */
  this.tokenCtrl = new TokenCtrl();
  this.tokenCtrl.setEntity(this.tokenEnt);

  kansasRouter.init(this);
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
