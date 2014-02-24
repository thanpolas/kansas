/**
 * @fileOverview The Usage model.
 */
var terminus = require('terminus');
var Promise = require('bluebird');
var middlewarify = require('middlewarify');

// var log = require('../util/logger').getLogger('kansas.model.usage');

var Model = require('./model-redis');
var period = require('./period-bucket.model');
var kansasError = require('../util/error');

var Usage = module.exports = Model.extend(function() {
  // wire set/del/get
  middlewarify.make(this, 'set', this.hmset.bind(this, []));
  middlewarify.make(this, 'get', this.hdel.bind(this));
  middlewarify.make(this, 'del', this.hget.bind(this, []));

  this.namespace = 'usage';
  this.idProp = 'token';
});

/**
 * Will consume a unit from a token.
 *
 * @param {string} token then token.
 * @return {Promise(number)} A promise with the usage units remaining, negative
 *   values mean the usage limit has been reached a rejection of Error type
 *   kansas.error.TokenNotExists
 */
Usage.prototype.consume = Promise.method(function(token) {
  // stub to month for now.
  var bucket = period.get(period.Period.MONTH);
  var key = this.getPrefix() + bucket + ':' + token;
  return this.decr(key).then(this._checkConsumeResult.bind(this, token));
});

/**
 * Will check the result of DECR, if negative will check if token even exists.
 *
 * @param {string} token then token.
 * @param {number} remaining usage units remaining.
 * @return {Promise(number)} A promise with the usage units remaining, negative
 *   values mean the usage limit has been reached.
 */
Usage.prototype._checkConsumeResult = Promise.method(function(token, remaining) {
  if (remaining > 0) {
    return remaining;
  }

  // not there, need to check if token exists
  var tokenKey = this.prefix + 'token:' + token;

  return this.exists(tokenKey).then(function(result) {
    if (result) {
      return remaining;
    } else {
      throw(new kansasError.TokenNotExists());
    }
  });
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
Usage.prototype.prePopulate = function() {
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
Usage.prototype._populateChunk = function (chunk, encoding, next) {
  var self = this;
  this.client.hmget(chunk, 'token', 'limit', 'period', function(err, res) {
    if (err) {return next(err);}
    var token = res[0];
    var limit = res[1];
    var periodName = res[2];

    // check if key not there
    if (!token) { return next();}

    var bucket = period.getFuture(periodName);
    var usageKey = self.getPrefix() + bucket + ':' + token;
    self.client.set(usageKey, limit, next);
  });
};
