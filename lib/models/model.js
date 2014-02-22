/**
 * @fileOverview The base Model Class all models extend from.
 */
var EventEmitter = require('events').EventEmitter;
var cip = require('cip');

var CeventEmitter = cip.cast(EventEmitter);

/**
 * The base Model Class all models extend from.
 *
 * @extends {events.EventEmitter}
 * @constructor
 */
var Model = module.exports = CeventEmitter.extend();

/** @const {string} Prefix for collection names */
Model.PREFIX = 'kansas-';

/**
 * All Collections (tables)
 *
 * @enum {string}
 */
Model.Collection = {
  APPLICATION: Model.PREFIX + 'application',
  TOKEN: Model.PREFIX + 'token',
};

/**
 * Helper for default value of date types.
 *
 * @param  {number} plusTime
 * @return {number} The JS timestamp in the future.
 * @static
 */
Model.defaultDate = function(plusTime) {
  return new Date(Date.now() + plusTime);
};
