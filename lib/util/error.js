/*jshint camelcase:false */
/**
 * @fileoverview Application error codes.
 */

var util = require('util');

var appError = module.exports = {};

/**
 * The abstract error which all errors extend.
 *
 * @param {string|Error=} optMsg the message or an Error Object.
 * @param {Object=} optCtor Calee constructor.
 * @constructor
 * @extends {Error}
 */
appError.BaseError = function (optMsg, optConstr) {
  Error.call(this);
  Error.captureStackTrace(this, optConstr || this);

  /**
   * If an instance of Error is passed to the arguments it is
   * assigned into this property.
   * @type {?Error}
   */
  this.srcError = null;

  if (optMsg instanceof Error) {
    this.srcError = optMsg;
  }

  var msg;
  if (optMsg && optMsg.length) {
    msg = optMsg;
  } else {
    msg = 'Error';
  }

  this.message = msg;
  this.name = 'Kansas Error';
  this.error = true;
};
util.inherits(appError.BaseError, Error);

/**
 * Database Error.
 *
 * @param {string|Error=} optMsg the message or an Error Object.
 * @constructor
 * @extends {kansas.error.BaseError}
 */
appError.Database = function (optMsg) {
  appError.Database.super_.call(this, optMsg, this.constructor);
  this.name = 'Database Error';
  var msg = (optMsg && optMsg.length) ? optMsg  : 'Database Error';
  this.message = msg;

  /**
   * @type {kansas.error.Database.Type} The type of error.
   */
  this.type = appError.Database.Type.UNKNOWN;

};
util.inherits(appError.Database, appError.BaseError);

/**
 * @enum {string} Database error types.
 */
appError.Database.Type = {
  UNKNOWN: 'unknown',
  MONGO: 'mongo',
  REDIS: 'redis',
  MONGOOSE: 'mongoose',
  CAST: 'cast',
  VALIDATION: 'validation',
  CRYPTO: 'crypto',
};

/**
 * Validation Error.
 *
 * @param {string=} optMsg the message.
 * @constructor
 * @extends {kansas.error.Database}
 * @see http://mongoosejs.com/docs/validation.html
 * @see https://github.com/LearnBoost/mongoose/blob/3.6.11/lib/errors/validation.js
 */
appError.Validation = function(optMsg) {
  appError.Validation.super_.call(this, optMsg, this.constructor);
  this.name = 'Validation Error';
  var msg = (optMsg && optMsg.length) ? optMsg  : 'Validation Error';
  this.message = msg;

  /** @inheritDoc */
  this.type = appError.Database.Type.VALIDATION;

  /** @type {Array.<ts.Error.ValidationItem>} An array of validation errors */
  this.errors = [];

};
util.inherits(appError.Validation, appError.BaseError);

/**
 * A validation item is a single validation error.
 * Instances of this class are included in the Validation Error Object.
 *
 * @param {string|mongoose.Error.ValidatorError} message An error message
 *   or a mongoose ValidatorError instance.
 * @param {string=} optPath The key that triggered the validation error.
 * @param {string=} optType The type of the validation error.
 * @param {string=} optValue The value used that generated the error.
 * @constructor
 * @see https://github.com/LearnBoost/mongoose/blob/3.6.11/lib/errors/validator.js
 */
appError.ValidationItem = function(message, optPath, optType, optValue) {
  /** @type {string} An error message to be consumed by end users */
  this.message = '';
  /** @type {?string} The key that triggered the validation error */
  this.path = null;
  /** @type {?string} The type of the validation error */
  this.type = null;
  /** @type {?string} The value used that generated the error */
  this.value = null;

  this.message = message || '';
  this.path = optPath || null;
  this.type = optType || null;
  this.value = optValue || null;
};

/**
 * Authentication Error.
 *
 * @param {string=} optMsg the message.
 * @constructor
 * @extends {kansas.error.BaseError}
 */
appError.Authentication = function(optMsg) {
  appError.Authentication.super_.call(this, optMsg, this.constructor);
  /** @type {string} */
  this.name = 'Authentication Error';
  var msg = (optMsg && optMsg.length) ? optMsg  : 'Authentication Error';
  this.message = msg;

  /** @type {kansas.error.Authentication.Type} */
  this.type = appError.Authentication.Type.UNKNOWN;
};
util.inherits(appError.Authentication, appError.BaseError);

/**
 * @enum {number} authentication error Types.
 */
appError.Authentication.Type = {
  UNKNOWN: 'unknown',
  EMAIL: 'email',
  PASSWORD: 'password',
  MONGO: 'mongo',
  SESSION: 'session',
  SOCKET: 'socket',
  CLIENT_TOKEN: 'clientToken',
  AUTH_TOKEN: 'authToken',
  INSUFFICIENT_CREDENTIALS: 'insufficientCredentials',
};


/**
 * Token Not Exists Error.
 *
 * @constructor
 * @extends {kansas.error.BaseError}
 */
appError.TokenNotExists = function() {
  var msg = 'Token not found';
  appError.TokenNotExists.super_.call(this, msg, this.constructor);
  /** @type {string} */
  this.name = 'Token Not Exists Error';
  this.message = msg;
};
util.inherits(appError.TokenNotExists, appError.BaseError);


/**
 * Usage limit exceeded.
 *
 * @constructor
 * @extends {kansas.error.BaseError}
 */
appError.UsageLimit = function() {
  var msg = 'Usage limit exceeded';
  appError.UsageLimit.super_.call(this, msg, this.constructor);
  /** @type {string} */
  this.name = 'Usage limit exceeded';
  this.message = msg;
};
util.inherits(appError.UsageLimit, appError.BaseError);

/**
 * Policy related errors.
 *
 * @param {string=} optMsg the message.
 * @constructor
 * @extends {kansas.error.BaseError}
 */
appError.Policy = function(optMsg) {
  appError.Policy.super_.call(this, optMsg, this.constructor);
  var msg = (optMsg && optMsg.length) ? optMsg  : 'Policy Error';
  this.message = msg;
  /** @type {string} */
  this.name = 'Policy Error';
  this.type = appError.Policy.Type.UNKNOWN;
};
util.inherits(appError.Policy, appError.BaseError);

/** @enum {string} Policy error types */
appError.Policy.Type = {
  NOT_FOUND: 'notFound',
  UNKNOWN: 'unknown',
  MAX_TOKENS_PER_USER: 'maxTokensPerUser',
};

