/**
 * @fileOverview The API Application model.
 */
var Promise = require('bluebird');
var log = require('../util/logger').getLogger('kansas.model.Application');

var Model = require('./model');
var ModelMongo = require('./model-mongo');
var mongoose = require('mongoose');

/**
 * The API Application model.
 *
 * @constructor
 * @extends {kansas.ModelMongo}
 */
var App = module.exports = ModelMongo.extendSingleton();

/**
 * Define the App schema
 * @type {Object}
 */
App.Schema = {
  name: {type: String, default: ''},
  hostname: {type: String, default: ''},
  createdOn: {type: Date, default: Date.now},
};

/**
 * Initialize the model.
 *
 * This fn is sync.
 */
App.prototype.init = function() {
  log.fine('init() :: initializing Application Model...');

  this.schema = new mongoose.Schema(App.Schema);

  this.schema.index({hostname: 1}, {unique: true});

  // initialize model
  this.Model = mongoose.model(Model.Collection.APPLICATION, this.schema);
};

