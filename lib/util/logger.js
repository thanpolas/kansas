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


  this._handleLogBinded = this._handleLog.bind(this);
});

/**
 * Inject another logg library instance.
 *
 * @param {logg} loggLib logg package.
 */
Logger.prototype.setLogg = function(loggLib) {
  this.logg.removeListener('', this._handleLogBinded);
  this.logg = loggLib;
  this.logg.on('', this._handleLogBinded);
  this.getLogger = loggLib.getLogger;
  this.log.fine('setLogg() :: "logg" module injected');
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
    this.logg.on('', this._handleLogBinded);
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
 * Log to console
 */
Logger.prototype.addConsole = function() {
  this.logg.addConsole();
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
 * Mute logger, stub all.
 */
Logger.prototype.unmute = function() {
  this.muted = false;

  this.getLogger = logg.getLogger;
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
  if (this.muted) {
    return;
  }
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
 * name: 'cc.model.Token'
 * rawArgs: [ 'createActual() :: Init...' ]
 * date: Tue Apr 16 2013 18:29:52 GMT+0300 (EEST)
 * message: 'createActual() :: Init...' }
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
