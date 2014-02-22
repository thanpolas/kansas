/**
 * @fileOverview API Applications.
 */
var EntityBase = require('./entity-base');
var helpers = require('../util/helpers');

/**
 * The Application entity.
 *
 * @param {kansas.model.Token} tokenModel an instance of the Token Model.
 * @constructor
 * @extends {kansas.EntityBase}
 */
var Token = module.exports = EntityBase.extend(function(tokenModel) {
  this.setModel(tokenModel.Model);
});
