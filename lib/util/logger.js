/**
 * @fileOverview Logging facilities, logfiles.
 */

// Nodejs libs.
var EventEmitter = require('events').EventEmitter;

var cip = require('cip');
var logg = require('logg');

var CeventEmitter = cip.cast(EventEmitter);

var Logger = module.exports = CeventEmitter.extend(function() {

  this.initialized = false;

  /** @type {logg} Expose logg library */
  this.logg = logg;

  /** @type {Function} shortcut assign */
  this.getLogger = logg.getLogger;

  /** @type {logg} The local logger */
  this.log = null;
});
/**
 * Initialize
 */
Logger.prototype.init = function() {
  if (this.initialized) {return;}
  this.log = this.getLogger('kansas.util.Logger');
  this.log.info('Logger initializing...');

  this.initialized = true;

  this.setLevel();
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
Logger.prototype.setLevel = function(optLevel) {
  var logLevel = 100;
  if (typeof optLevel === 'number') {
    logLevel = optLevel;
  }
  this.logg.rootLogger.setLogLevel(logLevel);
};
