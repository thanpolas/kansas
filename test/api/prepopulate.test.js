/**
 * @fileOverview Prepopulation unit tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var sinon = require('sinon');
var floordate = require('floordate');
var expect = chai.expect;

var tester = require('../lib/tester');

describe('Prepopulation of usage keys', function() {

  tester.initdb();

  beforeEach(function () {
    this.log = this.kansas.logger.getLogger('kansas.test.kansas.prepopulate');
  });

  describe('Skip one month ahead', function() {
    var clock;
    beforeEach(function() {
      var floored = floordate(Date.now(), 'month');
      var moveFwd = 40 * 24 * 3600 * 1000;
      clock = sinon.useFakeTimers(floored.getTime() + moveFwd);
      this.log.fine('beforeEach() :: Clock reset');
    });
    afterEach(function() {
      clock.restore();
    });

    it('check prepopulation works', function(done) {
      this.log.fine('test() :: starting prepopulate test...');

      var self = this;
      this.kansas.db.prepopulate()
        .bind(this)
        .then(function() {
          this.log.fine('test() :: prepopulate() done!');
          var keys = this.kansas.tokenModel.getKeys(this.tokenItem);
          var keysTwo = this.kansas.tokenModel.getKeys(this.tokenItemTwo);
          var pget = Promise.promisify(this.client.get, {context: this.client});

          var keysCount = self.kansas.tokenModel.getKeys(self.tokenItemCount);

          return Promise.all([
            pget(keys.usage),
            pget(keys.usageFuture),
            pget(keysTwo.usage),
            pget(keysTwo.usageFuture),
            pget(keysCount.usage),
            pget(keysCount.usageFuture),
          ])
            .bind(this)
            .then(function(result) {
              expect(result[0]).to.equal('10', 'usage one');
              expect(result[1]).to.equal('10', 'usage one future');
              expect(result[2]).to.equal('10', 'usage two');
              expect(result[3]).to.equal('10', 'usage two future');
              expect(result[4]).to.equal('1', 'usage count');
              expect(result[5]).to.equal('1', 'usage count future');
            });
          // you are here
        }).then(done, done);
    });
  });
});
