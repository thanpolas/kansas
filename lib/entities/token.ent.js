/**
 * @fileOverview API Applications.
 */
var EntityBase = require('./entity-base');
var TokenModel = require('../models/token.model');

/**
 * The Application entity.
 *
 * @constructor
 * @extends {kansas.EntityBase}
 */
var Token = module.exports = EntityBase.extendSingleton(function() {
  var tokenModel = TokenModel.getInstance();
  this.setModel(tokenModel.Model);
});
