/**
 * @fileOverview API Applications.
 */
var EntityBase = require('./entity-base');

/**
 * The Application entity.
 *
 * @param {kansas.model.Token} tokenModel an instance of the Token Model.
 * @constructor
 * @extends {kansas.EntityBase}
 */
var Token = module.exports = EntityBase.extendSingleton(function(tokenModel) {
  this.setModel(tokenModel.Model);
});
