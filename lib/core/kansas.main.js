/**
 * @fileOverview Kansas main module, instanciates a new set of resources.
 */
var __ = require('lodash');

var ConnMongo = require('./db-connection.main');

/**
 * Kansas main module, instanciates a new set of resources.
 *
 * @param {express} app An express instance.
 * @param {Object=} optOptions Options to configure Kansas.
 */
var Kansas = module.exports = function(app, optOptions) {

  /** @type {express} An express instance */
  this.app = app;

  /** @type {Object} A dict with options */
  this.options = this._handleOptions(optOptions);

  /** @type {kansas.main.ConnectionMongo} Instance of mongo connection */
  this.conn = new ConnMongo(this.options.mongo);
};

/**
 * Define default options and apply user defined ones.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 * @private
 */
Kansas.prototype._handleOptions = function(optOptions) {
  var defaultValues = {
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
