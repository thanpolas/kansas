/**
 * @fileOverview The tokens model.
 *
 */
var Promise = require('bluebird');
var terminus = require('terminus');
var logger = require('../main/logger.main');

var Db = require('./db-main');

var period = require('../models/period-bucket.model');
var UsageModel = require('../models/usage.model');

var Populate = module.exports = Db.extend(function() {
  this.set = Promise.promisify(this.client.set, this.client);

  this.namespace = 'usage';
});

/**
 * Perform pre-population of existing tokens.
 *
 * This can be a rather intensive operation, it will create new records
 * equal to the stored tokens. As this method will get invoked each time
 * Kansas starts it may become a bottleneck to your applications boot time.
 * If that's your case it's preferably to run this operation manualy using a
 * worker and a cronned job.
 *
 *
 * @return {Promise} A promise when the operation is complete.
 */
Populate.prototype.prepopulate = function() {
  this.log = logger.getLogger('kansas.db.Populate');

  var self = this;
  return new Promise(function(resolve, reject) {
    var pattern = self.prefix + 'token*';
    self.log.info('prepopulate() :: Starting prepopulation...');
    var streamWriter = terminus({objectMode: true}, self._populateChunk.bind(self));
    streamWriter.on('error', reject);
    streamWriter.on('finish', resolve);

    self.client.scan({pattern: pattern, count: 1})
      .pipe(streamWriter);
  }).then(function() {
    self.log.fine('prepopulate() :: Done!');
  });
};

/**
 * Handle a single chunk (key) from the master scanning operation.
 *
 * @param {string} chunk The key.
 * @param {string} encoding Encoding.
 * @param {Function} next Callback.
 * @private
 */
Populate.prototype._populateChunk = function (chunk, encoding, next) {
  //
  //
  // NOTE: The extensive logging is done to hunt down an elusive bug that
  //    randomly fails builds on Travis, as this is a highly repetitive routine
  //    when this issue is cleared all logging should be removed.
  //
  //
  var self = this;
  this.log.finer('_populateChunk() :: Will populate keys for:', chunk);
  this.client.hmget(chunk, 'token', 'limit', 'period', 'count', function(err, res) {
    if (err) {return next(err);}
    if (!Array.isArray(res)) {
      self.log.warn('_populateChunk() :: No result returned for token:', chunk, ' skipping.');
      next();
      return;
    }
    var token = res[0];
    var limit = res[1];
    var periodName = res[2];
    var count = res[3];

    self.log.finer('_populateChunk() :: Values set, token:', token);
    // check if key not there
    if (!token) {
      next();
      return;
    }

    if (period.periods.indexOf(periodName) < 0) {
      self.log.finer('_populateChunk() :: Not a valid period was found:',
        periodName, 'skipping...');
      next();
      return;
    }

    self._checkAndPopulateCurrent(periodName, token, limit, count)
      .then(function() {
        return self._populateNextPeriod(periodName, token, limit, count)
          .return(null)
          .then(next);
      })
      .catch(function(err) {
        self.log.error('_populateChunk() :: Error:', err);
      });
  });
};

/**
 * Check if current month's usage keys are populate and if not populate them.
 *
 * @param {kansas.model.period.Period} periodName The periodname.
 * @param {string} token The token.
 * @param {string} limit The limit.
 * @param {boolean} count If this is a Count Policy token.
 * @return {Promise} A promise.
 * @private
 */
Populate.prototype._checkAndPopulateCurrent = Promise.method(function(periodName,
  token, limit, count) {

  var usageKey;
  var startingPoint;

  var bucket = period.get(periodName);

  if (count === '1') {
    usageKey = this.getPrefix() + bucket + ':count:' + token;
    startingPoint = UsageModel.COUNT_START;
  } else {
    usageKey = this.getPrefix() + bucket + ':' + token;
    startingPoint = limit;
  }

  return this.exists(usageKey)
    .bind(this)
    .then(function(exists) {
      if (exists === 0) {
        this.log.finer('_checkAndPopulateCurrent() :: Token "' + token + '"',
          ' populated for current period.');
        return this.set(usageKey, startingPoint);
      }
    });
});


/**
 * Lookahead one period unit and create the usage key.
 *
 * @param {kansas.model.period.Period} periodName The periodname.
 * @param {string} token The token.
 * @param {string} limit The limit.
 * @param {boolean} count If this is a Count Policy token.
 * @return {Promise} A promise.
 */
Populate.prototype._populateNextPeriod = Promise.method(function(periodName,
  token, limit, count) {

  var usageKey;
  var startingPoint;

  var bucket = period.getFuture(periodName);

  if (count === '1') {
    usageKey = this.getPrefix() + bucket + ':count:' + token;
    startingPoint = UsageModel.COUNT_START;
  } else {
    usageKey = this.getPrefix() + bucket + ':' + token;
    startingPoint = limit;
  }

  return this.exists(usageKey)
    .bind(this)
    .then(function(exists) {
      if (exists === 0) {
        this.log.finer('_populateNextPeriod() :: Token "' + token + '" populated,',
          ' moving to next');

        return this.set(usageKey, startingPoint);
      } else {
        this.log.finer('_populateNextPeriod() :: Token "' + token + '" was',
          'already populated, skipping...');
      }
    });
});
