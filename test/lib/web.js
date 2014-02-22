/**
 * @fileOverview Common API testing library.
 */

var req = require('supertest');

var WEBSERVER_HOSTNAME = 'localhost';
var WEBSERVER_PORT = '6699';

/**
 * Provides connectivity and network helpers.
 *
 * @param {Expres=} An express instance.
 * @constructor
 */
module.exports = function(optApp) {
  var app = optApp || 'http://' + WEBSERVER_HOSTNAME + ':' + WEBSERVER_PORT;
  this.req = req(app);
  this.hasAuthorized = false;
  this.udo = null;
};
