/**
 * @fileOverview The Usage model.
 */
var terminus = require('terminus');
var Promise = require('bluebird');
var middlewarify = require('middlewarify');

// var log = require('../util/logger').getLogger('kansas.model.usage');

var Model = require('./model-redis');
var period = require('./period-bucket.model');

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
 *   values mean the usage limit has been reached.
 */
Usage.prototype.consume = Promise.method(function(token) {

  // stub to month for now.
  var bucket = period.get(period.Unit.MONTH);
  var key = this.getPrefix() + bucket + ':' + token;
  return this.decr(key);
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
    var pattern = self.getPrefix() + 'token*';
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
    var period = res[2];

    // check if key not there
    if (!token) { return next();}

    var bucket = period.getFuture(period);
    var usageKey = self.getPrefix() + bucket + ':' + token;
    self.client.set(usageKey, limit, next);
  });
};
