/**
 * @fileOverview The base Model Class mongo models extend from.
 */
// var __ = require('lodash');

var Model = require('./model');

/**
 * The base Model Class mongo models extend from.
 *
 * @constructor
 * @extends {cc.Model}
 */
var ModelMongo = module.exports = Model.extend(function() {
  /** @type {?mongoose.Schema} Instance of mongoose Schema */
  this.schema = null;
});
