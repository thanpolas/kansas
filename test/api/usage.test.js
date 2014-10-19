/**
 * @fileOverview Usage model unit tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var sinon = require('sinon');
var floordate = require('floordate');
var expect = chai.expect;

var kansasError = require('../../lib/util/error');
var tester = require('../lib/tester');

describe('Usage Model', function() {
  this.timeout(4000);

  tester.initdb();

  describe('Limit Policies', function () {
    it('consumes a unit', function(done) {
      this.kansas.consume(this.token).then(function(remaining) {
        expect(remaining).to.equal(9);
      }).then(done, done);
    });
    it('over limit returns error', function(done) {
      var self = this;
      // create an array with 10 elements of the token to consume.
      var consume = Array.apply(null, new Array(10)).map(function() {
        return self.token;
      });
      Promise.map(consume, function(token) {
        return self.kansas.consume(token);
      })
        .then(function() {
          return self.kansas.consume(self.token).then(function() {
            throw new Error('Should not allow to consume');
          }).catch(function(err) {
            expect(err).to.be.instanceOf(kansasError.UsageLimit);
          });
        }).then(done, done);
    });
    it('accepts units to consume', function(done) {
      var self = this;
      this.kansas.consume(this.token, 10)
        .then(function() {
          return self.kansas.consume(self.token).then(function() {
            throw new Error('Should not allow to consume');
          }).catch(function(err) {
            expect(err).to.be.instanceOf(kansasError.UsageLimit);
          });
        }).then(done, done);
    });
  });

  describe('Count Policies', function () {
    it('Counts a unit', function(done) {
      this.kansas.count(this.tokenItemCount.token).then(function(consumed) {
        expect(consumed).to.equal(1);
      }).then(done, done);
    });
    it('accepts units to count', function(done) {
      this.kansas.count(this.tokenItemCount.token, 10).then(function(consumed) {
        expect(consumed).to.equal(10);
      }).then(done, done);
    });
    it('counts three times', function(done) {
      var self = this;
      this.kansas.count(this.tokenItemCount.token).then(function() {
        return self.kansas.count(self.tokenItemCount.token).then(function() {
          return self.kansas.count(self.tokenItemCount.token).then(function(consumed) {
            expect(consumed).to.equal(3);
          });
        });
      }).then(done, done);
    });
  });

  describe('Check month period', function() {
    var clock;
    beforeEach(function() {
      var floored = floordate(Date.now(), 'month');
      clock = sinon.useFakeTimers(floored.getTime());
    });
    afterEach(function() {
      clock.restore();
    });
    it('Will roll over to next month and reset limit', function(done) {
      var self = this;
      var consume = Array.apply(null, new Array(10)).map(function() {
        return self.token;
      });

      Promise.map(consume, function(token) {
        return self.kansas.consume(token);
      })
        .then(function() {
          // move time fwd 40days.
          var moveFwd = 40 * 24 * 3600 * 1000;
          clock.tick(moveFwd);
          return self.kansas.consume(self.token).then(function(remaining) {
            expect(remaining).to.equal(9);
          });
        }).then(done, done);
    });
  });
});

