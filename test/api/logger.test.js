/**
 * @fileOverview Kansas logger facilities.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var kansas = require('../..');
var fixtures = require('../lib/fixtures-api');

describe.only('Logger', function() {
  this.timeout(4000);

  it('Will emit "message" events', function(done) {
    var api = kansas({console: false});
    api.on('message', function(msgObj) {
      // Sample Object
      //
      // { 
      //   level: 200,
      //   name: 'kansas.main.redis',
      //   meta: undefined,
      //   rawArgs: 
      //    [ 'getClient() :: Creating client using host, port:',
      //      'localhost',
      //      6379 ],
      //   date: Sat Mar 01 2014 19:14:47 GMT+0200 (EET),
      //   message: 'getClient() :: Creating client using host, port: localhost 6379'
      // }
      expect(msgObj).to.be.an('Object');
      expect(msgObj).to.have.property('level');
      expect(msgObj).to.have.property('name');
      expect(msgObj).to.have.property('date');
      expect(msgObj).to.have.property('message');
    });
    api.connect().then(done.bind(null, null), done);
  });

  it('Will not emit any "message" events if logging is off', function(done) {
    var api = kansas({logging: false});
    api.on('message', done);
    api.connect().then(done.bind(null, null), done);
  });
});
