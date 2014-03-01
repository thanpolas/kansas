/**
 * @fileOverview Logging facilities, logfiles.
 */

// Nodejs libs.
var EventEmitter = require('events').EventEmitter;

var cip = require('cip');
var logg = require('logg');

var CeventEmitter = cip.cast(EventEmitter);

function noop() {}

var Logger = module.exports = CeventEmitter.extend(function() {

  this.initialized = false;

  /** @type {logg} Expose logg library */
  this.logg = logg;

  /** @type {Function} shortcut assign */
  this.getLogger = logg.getLogger;

  /** @type {logg} The local logger */
  this.log = null;

  /** @type {boolean} Indicates if logging is off */
  this.muted = false;

});

/**
 * Inject another logg library instance.
 *
 * @param {logg} loggLib logg package.
 */
Logger.prototype.setLogg = function(loggLib) {
  this.logg = loggLib;
  this.getLogger = loggLib.getLogger;
};

/**
 * Initialize
 */
Logger.prototype.init = function() {
  if (this.initialized) {return;}
  if (this.muted) {
    this.initialized = true;
    return;
  }
  this.log = this.getLogger('kansas.util.Logger');
  this.log.info('Logger initializing...');

  this.initialized = true;

  this.logLevel = 100;
  this.setLevel();

  // hook on logger
  try {
    this.logg.on('', this._handleLog.bind(this));
  } catch(ex) {
    console.error('Kansas Logger failed:', ex);
  }
};

/**
 * Don't log to console
 */
Logger.prototype.noConsole = function() {
  this.logg.removeConsole();
};

/**
 * Mute logger, stub all.
 */
Logger.prototype.mute = function() {
  this.muted = true;

  this.getLogger = function() {
    return {
      finest: noop,
      finer: noop,
      fine: noop,
      info: noop,
      warn: noop,
      error: noop,
    };
  };
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
  if (typeof optLevel === 'number') {
    this.logLevel = optLevel;
  }
  this.logg.rootLogger.setLogLevel(this.logLevel);
};

/**
 * Handle a captured log event.
 *
 * Sample logRecord object:
 *
 * level: 100
 * name: 'ts.ctrl.process'
 * rawArgs: [ '_masterLoop() :: Loop: 2 processing: 0 concurrent jobs: 1' ]
 * date: Tue Apr 16 2013 18:29:52 GMT+0300 (EEST)
 * message: '_masterLoop() :: Loop: 2 processing: 0 concurrent jobs: 1' }
 *
 *
 * @param  {Object} logRecord As seen above.
 * @private
 */
Logger.prototype._handleLog = function(logRecord) {

  // Muted and log level check.
  if (this.muted || this.logLevel > logRecord.level) {
    return;
  }

  // relay the record
  this.emit('message', logRecord);
};
