/**
 * @fileOverview API Applications.
 */
var EntityBase = require('./entity-base');
var ApplicationModel = require('../models/application.model');

/**
 * The Application entity.
 *
 * @constructor
 * @extends {kansas.EntityBase}
 */
var Application = module.exports = EntityBase.extendSingleton(function() {
  var applicationModel = ApplicationModel.getInstance();
  this.setModel(applicationModel.Model);
});
