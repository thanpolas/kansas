/**
 * @fileOverview The API Application model.
 */

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
 * @param {Function(Error=)} done callback.
 */
App.prototype.init = function(done) {
  log.fine('init() :: initializing Application Model...');

  this.schema = new mongoose.Schema(App.Schema);

  // initialize model
  this.Model = mongoose.model(Model.Collection.APPLICATION, this.schema);
  done();
};

