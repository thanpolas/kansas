/**
 * @fileOverview The API Application model.
 */
// var Promise = require('bluebird');
var mongoose = require('mongoose');
var validator = require('validator');
var log = require('../util/logger').getLogger('kansas.model.Application');

var Model = require('./model');
var ModelMongo = require('./model-mongo');

var helpers = require('../util/helpers');

/**
 * The API Application model.
 *
 * @constructor
 * @extends {kansas.ModelMongo}
 */
var App = module.exports = ModelMongo.extend();

/**
 * Define the App schema
 * @type {Object}
 */
App.Schema = {
  name: {type: String, default: '', required: true},
  uniqueUrl: {type: String, default: '', required: true},
  hostname: {type: String, default: '', required: true},
  ownerId: {type: String, default: ''},
  createdOn: {type: Date, default: Date.now},
  tokens: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: Model.Collection.TOKEN,
  }],
};

/**
 * Initialize the model.
 *
 * This fn is sync.
 */
App.prototype.init = function() {
  log.fine('init() :: initializing Application Model...');

  this.schema = new mongoose.Schema(App.Schema);

  this.schema.pre('validate', this._setUniqueUrl);

  this.schema.pre('validate', this._validateHostname);

  this.schema.index({hostname: 1}, {unique: true});
  this.schema.index({uniqueUrl: 1}, {unique: true});

  // initialize model
  this.Model = mongoose.model(Model.Collection.APPLICATION, this.schema);
};

/**
 * Create a unique url from the name of the application.
 *
 * @param {Function} next Callback.
 * @protected
 */
App.prototype._setUniqueUrl = function(next) {
  this.uniqueUrl.localUrl = helpers.urlify(this.name);
  next();
};

/**
 * Validate the value of the hostname.
 *
 * @param {Function} next callback.
 * @private
 */
App.prototype._validateHostname = function(next) {
  this.hostname = validator.trim(this.hostname);

  // try to be nice
  if (this.hostname.indexOf('https://') > -1) {
    this.hostname = this.hostname.replace('https://', '');
  }
  if (this.hostname.indexOf('http://') > -1) {
    this.hostname = this.hostname.replace('http://', '');
  }

  next();
};
