/**
 * @fileOverview The API Application model.
 */
var mongoose = require('mongoose');
var log = require('../util/logger').getLogger('kansas.model.token');

var Model = require('./model');
var ModelMongo = require('./model-mongo');

var helpers = require('../util/helpers');

/**
 * The API Application model.
 *
 * @constructor
 * @extends {kansas.ModelMongo}
 */
var Token = module.exports = ModelMongo.extend();

/**
 * Define the Token schema
 * @type {Object}
 */
Token.Schema = {
  token: {type: String, default: ''},
  createdOn: {type: Date, default: Date.now},
  applicationParent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Model.Collection.APPLICATION,
  },
};

/**
 * Initialize the model.
 *
 * This fn is sync.
 */
Token.prototype.init = function() {
  log.fine('init() :: initializing Application Model...');

  this.schema = new mongoose.Schema(Token.Schema);

  this.schema.pre('validate', this._setToken);

  this.schema.index({token: 1}, {unique: true});

  // initialize model
  this.Model = mongoose.model(Model.Collection.TOKEN, this.schema);
};

/**
 * Get a randomish string to use as the token
 *
 * @param {Function} next callback.
 * @private
 */
Token.prototype._setToken = function(next) {
  this.token = helpers.generateRandomString(16);
  next();
};

