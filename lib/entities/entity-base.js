/**
 * @fileOverview The entities base class.
 */
var EntityCrudSequelize = require('node-entity').Mongoose;

var kansasError = require('../util/error');

/**
 * The base Entity Class all entities extend from.
 *
 * @constructor
 * @extends {crude.Entity}
 */
var Entity = module.exports = EntityCrudSequelize.extend();

/**
 * Wrap the default "create" method,
 * taking care to normalize any error messages.
 *
 * @param {Object} itemData The data to use for creating.
 * @param {Function(?kansas.error.Abstract, Mongoose.Model=)} done callback.
 * @override
 */
Entity.prototype._create = function(itemData) {
  // stub to default for now until Mongoose is normalized
  return EntityCrudSequelize.prototype._create.call(this, itemData)
    .catch(this._normalizeErrors.bind(this));
};

/**
 * Normalize errors comming from the db
 *
 * @param {Object} err Error as provided by the orm.
 * @return {Promise} A Promise.
 * @private
 * @throws {kansas.error.ErrorBase} always.
 */
Entity.prototype._normalizeErrors = function(err) {
  var error = new kansasError.Validation(err);
  throw error;
};
