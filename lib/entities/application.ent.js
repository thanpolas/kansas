/**
 * @fileOverview API Applications.
 */
var EntityBase = require('./entity-base');
var ApplicationModel = require('../models/application.model');

// var helpers = require('../util/helpers');

/**
 * The Application entity.
 *
 * @constructor
 * @extends {cc.EntityBase}
 */
var Application = module.exports = EntityBase.extendSingleton(function() {
  var applicationModel = ApplicationModel.getInstance();
  this.setModel(applicationModel.Model);
});
