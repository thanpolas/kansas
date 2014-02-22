/**
 * @fileOverview The API Application model.
 */
var log = require('../util/logger').getLogger('kansas.model.token');

var Model = require('./model');
var ModelMongo = require('./model-mongo');
var mongoose = require('mongoose');

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
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Model.Collection.TOKEN,
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

  this.schema.index({token: 1}, {unique: true});

  // initialize model
  this.Model = mongoose.model(Model.Collection.TOKEN, this.schema);
};
