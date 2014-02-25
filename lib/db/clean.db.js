/**
 * @fileOverview DB Manage methods, cleaning.
 */
var Promise = require('bluebird');
var terminus = require('terminus');
// var log = require('../util/logger').getLogger('kansas.db.Populate');

var Db = require('./db-main.js');

var Clear = module.exports = Db.extend(function() {});

/**
 * Will nuke all records.
 *
 * @param {string} confirm expects the exact string: 
 *   'Yes purge all records irreversibly'
 * @param {string} prefix Confirm the nuking by using the same prefix used
 *   when instantiating.
 * @return {Promise} A promise when the operation is complete.
 */
Clear.prototype.nuke = function(confirm, prefix) {
  var self = this;
  return new Promise(function(resolve, reject) {

    if (confirm !== 'Yes purge all records irreversably') {
      throw new Error('Requires confirmation');
    }

    if (prefix !== self.opts.prefix) {
      throw new Error('prefix does not match. Provided: ' + prefix +
        ' prefix is: ' + self.opts.prefix);
    }

    var pattern = self.prefix + '*';
    var streamWriter = terminus({objectMode: true}, self._purgeChunk.bind(self));
    streamWriter.on('error', reject);
    streamWriter.on('finish', resolve);

    self.client.scan({pattern: pattern, count: 1})
      .pipe(streamWriter);
  });
};

/**
 * Handle a single chunk (key) and purge it.
 *
 * @param {string} chunk The key.
 * @param {string} encoding Encoding.
 * @param {Function} next Callback.
 * @private
 */
Clear.prototype._purgeChunk = function(chunk, encoding, next) {
  this.del(chunk).then(next.bind(null, null), next);
};
