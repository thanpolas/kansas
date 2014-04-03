/*global -Map, -Set*/
/**
 * @fileOverview The policies model, stores policies in memory.
 */
var Map = require('collections/map');

var Model = require('./model');

/**
 * The policies model, stores policies in memory.
 *
 * @constructor
 * @extends {kansas.model.Model}
 */
var Policy = module.exports = Model.extend(function() {
  this.store = new Map();
  this.get = this.store.get.bind(this.store);
  this.has = this.store.has.bind(this.store);
});

/**
 * Will create a new policy and return the value.
 *
 * @param {Object} userValues The item to save, expects:
 *   @param {string} name The policy name.
 *   @param {number} maxTokens [integer] Maximum number of tokens.
 *   @param {number=} limit [integer] Maximum requests limit per given period (now only month).
 *   @param {boolean=} count Set to true to make policy Count vs consume.
 *   @param {kansas.model.periodBucket.Period} period The period.
 * @return {Object} The policy item
 */
Policy.prototype.create = function(userValues) {
  if (this.store.has(userValues.name)) {
    return this.store.get(userValues.name);
  }

  var item = Object.create(null);
  item.name = userValues.name;
  item.maxTokens = userValues.maxTokens;
  item.limit = userValues.limit || NaN;
  item.count = !!userValues.count;
  item.period = 'month';
  this.store.set(userValues.name, item);
  return item;
};
