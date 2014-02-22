/**
 * @fileOverview Logging facilities, logfiles.
 */

// Nodejs libs.
var EventEmitter = require('events').EventEmitter;

var logg = require('logg');

var initialized = false;

var logger = module.exports = new EventEmitter();

/** @type {logg} Expose logg library */
logger.logg = logg;

/** @type {Function} shortcut assign */
logger.getLogger = logg.getLogger;

var log = logger.getLogger('kansas.util.logger');

/**
 * Initialize
 */
logger.init = function() {
  log.info('Logger initializing...');
  if (initialized) {return;}
  initialized = true;

  logger.setLevel();
};


/**
 * Set the minimum logging level for logg.
 *
 * Log Levels:
 *   SEVERE: 1000
 *   WARN:   800
 *   INFO:   600
 *   FINE:   400
 *   FINER:  200
 *   FINEST: 100
 *
 * @param {number=} optLevel define the logging verbocity.
 */
logger.setLevel = function(optLevel) {
  var logLevel = 100;
  if (typeof optLevel === 'number') {
    logLevel = optLevel;
  }
  logg.rootLogger.setLogLevel(logLevel);
};
