/**
 * @fileOverview API Applications.
 */
var EntityBase = require('./entity-base');

/**
 * The Application entity.
 *
 * @param {kansas.model.Application} tokenModel an instance of the Application Model.
 * @constructor
 * @extends {kansas.EntityBase}
 */
module.exports = EntityBase.extend(function(applicationModel) {
  this.setModel(applicationModel.Model);
});

