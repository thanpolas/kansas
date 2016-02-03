
/**
 * @fileOverview Usage model unit tests.
 */
// var Promise = require('bluebird');
var chai = require('chai');
// var sinon = require('sinon');
// var floordate = require('floordate');
var expect = chai.expect;

// var kansasError = require('../../lib/util/error');
var tester = require('../lib/tester');

describe('Get Usage Model', function() {

  tester.initdb();

  describe('Getting Usage', function () {
    beforeEach(function (done) {
      this.kansas.consume(this.token, 3)
        .then(done.bind(null, null), done);
    });
    beforeEach(function (done) {
      this.kansas.count(this.tokenItemCount.token, 4)
        .then(done.bind(null, null), done);
    });

    it('Gets usage for a [limit] token', function(done) {
      this.kansas.getUsage(this.token).then(function(remaining) {
        expect(remaining).to.equal(7);
      }).then(done, done);
    });
    it('Gets usage for a [limit] user id', function(done) {
      this.kansas.getUsageByOwnerId(this.tokenItem.ownerId)
        .bind(this)
        .then(function(remaining) {
          expect(remaining).to.have.length(2);
          remaining.forEach(function(tokenItem) {
            expect(tokenItem.usage).to.be.a('number');
            if (tokenItem.token === this.token) {
              expect(tokenItem.usage).to.equal(7);
            }
          }, this);
        }).then(done, done);
    });
    it('Gets usage for a [count] token', function(done) {
      this.kansas.getUsage(this.tokenItemCount.token).then(function(used) {
        expect(used).to.equal(5);
      }).then(done, done);
    });
    it('Gets usage for a [count] user id', function(done) {
      this.kansas.getUsageByOwnerId(this.tokenItemCount.ownerId)
        .bind(this)
        .then(function(results) {
          expect(results).to.have.length(1);
          results.forEach(function(tokenItem) {
            expect(tokenItem.usage).to.be.a('number');
            if (tokenItem.token === this.tokenItemCount.token) {
              expect(tokenItem.usage).to.equal(5);
            }
          }, this);
        }).then(done, done);
    });
  });
});
