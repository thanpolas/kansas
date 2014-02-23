/**
 * @fileOverview Will handle connectivity to the databases and alert on issues.
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');

var Promise = require('bluebird');
var mongoose = require('mongoose');
var log = require('../util/logger').getLogger('kansas.main.ConnectionMongo');

// models
var AppModel = require('../models/application.model');
var TokenModel = require('../models/token.model');

/**
 * This module is an instance of EventEmitter.
 *
 * @event `open`: Emitted after we `connected` and `onOpen` is executed
 *   on all of this connections models.
 * @event `close`: Emitted after we `disconnected` and `onClose` executed
 *   on all of this connections models.
 * @event `error`: Emitted when an error occurs on this connection.
 *
 * @param {Object} A dict with required options (see assignment bellow).
 * @constructor
 * @extends {events.EventEmitter}
 */
var Conn = module.exports = function(opts) {
  if (opts.database in Conn.instances) {
    return Conn.instances[opts.database];
  }
  EventEmitter.call(this);

  /** @type {boolean} Indicates if inited and event handlers added to libs */
  this._initialized = false;

  /**
   * Reference for the mongo reconnect setTimeout index or null.
   * @type {?setTimeout}
   * @private
   */
  this._mongoReconnTimer = null;

  /** @type {?mongoose.connect} The mongoose connection object */
  this.db = null;

  this.appModel = new AppModel();
  this.tokenModel = new TokenModel();

  /** @type {Object} A dict with options */
  this.opts = {
    user: opts.user,
    password: opts.password,
    hostname: opts.hostname,
    reconnectTime: opts.reconnectTime,
    database: opts.database,
  };
  Conn.instances[opts.database] = this;

};
util.inherits(Conn, EventEmitter);

/** @type {Object} Will contain instances of Conn with the db name as keys */
Conn.instances = {};

/**
 * Mongo ready states.
 *
 * @type {number}
 */
Conn.MongoState = {
  DISCONNECTED: 0,
  CONNECTED: 1,
  CONNECTING: 2,
  DISCONNECTING: 3
};

/**
 * Initiate the connections with the db.
 *
 * This method should only be called once per instantiation.
 *
 * @return {Promise} a promise.
 */
Conn.prototype.connect = Promise.method(function() {
  log.fine('connect() :: Init. _initialized:', this._initialized);

  if (this._initialized) { return; }
  this._initialized = true;

  // Listen to global mongoose event handlers
  mongoose.connection.on('open', this._onOpen.bind(this));
  mongoose.connection.on('close', this._onClose.bind(this));
  mongoose.connection.on('error', this._onError.bind(this));

  return this._connectMongo()
    .then(this._initModels.bind(this));
});

/**
 * Initialize all the models.
 *
 * @return {Promise} A promise.
 * @private
 */
Conn.prototype._initModels = function() {
  return Promise.all([
    this.appModel.init(),
    this.tokenModel.init(),
  ]);
};


/**
 * Create a connection with mongo.
 *
 * @return {Promise} a promise.
 * @private
 */
Conn.prototype._connectMongo = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    log.fine('_connectMongo() :: Init. Hostname:', self.opts.hostname);

    // force clear reconn timers
    clearTimeout(this._mongoReconnTimer);
    this._mongoReconnTimer = null;

    // check if already connected
    if (mongoose.connection.readyState === Conn.MongoState.CONNECTED) {
      return resolve();
    }

    // http://mongoosejs.com/docs/connections.html
    var mongoUri = self.getMongoUri();
    var mongoOpts = {
      user: self.opts.user,
      pass: self.opts.password,
      server: {
        socketOptions: {
          keepAlive: 1
        }
      }
    };

    mongoose.connect(mongoUri, mongoOpts);
    var db = self.db = mongoose.connection.db;

    // rather silly callback mechanism.
    var cbDone = false;
    function onErrorLocal(err) {
      if (cbDone) {return;}
      cbDone = true;
      db.removeListener('open', onOpenLocal);
      reject(err);
    }
    function onOpenLocal() {
      if (cbDone) {return;}
      cbDone = true;
      db.removeListener('error', onErrorLocal);
      resolve();
    }

    mongoose.connection.once('error', onErrorLocal);
    mongoose.connection.once('open', onOpenLocal);
  });
};

/**
 * Close connection to Mongo db.
 *
 * @param {Function=} done optional.
 */
Conn.prototype.closeMongo = function(done) {
  log.info('closeMongo() :: Closing mongo connection... readyState:',
    mongoose.connection.readyState);
  mongoose.connection.close(done);
};

/**
 * re-start a mongo connection, will close connection first.
 *
 * @param  {Function} done Callback.
 */
Conn.prototype.openMongo = function(done) {
  log.info('openMongo() :: re-Opening mongo connection... readyState:',
    mongoose.connection.readyState);
  var self = this;
  this.closeMongo(function() {
    self._connectMongo(done);
  });
};

/**
 * Returns the proper mongo uri to use for connecting.
 *
 * @return {string} the uri.
 */
Conn.prototype.getMongoUri = function() {
  return 'mongodb://' + this.opts.hostname + '/' + this.opts.database;
};

/**
 * Handle mongoose `open` events.
 * @private
 */
Conn.prototype._onOpen = function() {
  log.fine('_onOpen() :: Connected to mongo. Server:', this.opts.hostname);

  if (this._mongoReconnTimer) {
    clearTimeout(this._mongoReconnTimer);
    this._mongoReconnTimer = null;
  }

  this.emit('open');
};

/**
 * Handle mongoose `close` events.
 * @private
 */
Conn.prototype._onClose = function() {
  log.warn('_onClose() :: Connection to mongoDB lost');

  // force
  mongoose.connection.readyState = Conn.MongoState.DISCONNECTED;

  // clear connection
  this.db.close();

  // Attempt to reconnect in x time.
  var reconnTime = this.opts.reconnectTime;
  if (this._mongoReconnTimer) {
    log.fine('_onClose() :: Reconnection timer already running');
  } else {
    log.info('_onClose() :: Attempting to reconnect in ' + reconnTime + 'ms');
    this._mongoReconnTimer = setTimeout(this._connectMongo.bind(this), reconnTime);
  }

  this.emit('close');
};

/**
 * Handle mongoose `error` events.
 *
 * @param {Error} err Mongoose error.
 * @private
 */
Conn.prototype._onError = function(err) {
  log.warn('_onError() :: Connection Error:', err);

  this.emit('error', err);
};

