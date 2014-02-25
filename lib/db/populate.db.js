/**
 * @fileOverview The tokens model.
 */
var Promise = require('bluebird');
var terminus = require('terminus');
// var log = require('../util/logger').getLogger('kansas.db.Populate');

var Db = require('./db');

var period = require('./period-bucket.model');

var Populate = module.exports = Db.extend(function() {});

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
Populate.prototype.prePopulate = function() {
  var self = this;
  return new Promise(function(resolve, reject) {
    var pattern = self.prefix + 'token*';
    var streamWriter = terminus({objectMode: true}, self._populateChunk.bind(self));
    streamWriter.on('error', reject);
    streamWriter.on('finish', resolve);

    self.client.scan({pattern: pattern, count: 1})
      .pipe(streamWriter);
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
  var self = this;
  this.client.hmget(chunk, 'token', 'limit', 'period', function(err, res) {
    if (err) {return next(err);}
    var token = res[0];
    var limit = res[1];
    var periodName = res[2];

    // check if key not there
    if (!token) { return next();}

    Promise.all([
      self._populateNextPeriod(periodName, token, limit),
    ]).then(next.bind(null, null), next);
  });
};

/**
 * Lookahead one period unit and create the usage key.
 *
 * @param {kansas.model.period.Period} periodName The periodname.
 * @param {string} token The token.
 * @param {string} limit The limit.
 * @return {Promise} A promise.
 */
Populate.prototype._populateNextPeriod = Promise.method(function(periodName,
  token, limit) {
  var bucket = period.getFuture(periodName);
  var usageKey = this.getPrefix() + bucket + ':' + token;
  return this.client.set(usageKey, limit);
});
