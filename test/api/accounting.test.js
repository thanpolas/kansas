/**
 * @fileOverview Accounting model unit tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var tester = require('../lib/tester');

describe('Accounting', function() {

  tester.initdb();

  beforeEach(function () {
    return this.kansas.create({
      policyName: 'countPolicy',
      ownerId: 'countPolicy1',
    })
      .bind(this)
      .then(function(item) {
        this.tokenItemAccounting = item;
      });
  });

  beforeEach(function () {
    return this.kansas.create({
      policyName: 'basic',
      ownerId: 'basicPolicy1',
    })
      .bind(this)
      .then(function(item) {
        this.tokenItemBasic = item;
      });
  });


  it('changePolicy() will alter the records', function(done) {
    var change = {
      ownerId: this.tokenItem.ownerId,
      policyName: 'basic',
    };
    this.kansas.policy.change(change)
      .bind(this)
      .then(function() {
        var keys = this.kansas.tokenModel.getKeys(this.tokenItem);
        var keysTwo = this.kansas.tokenModel.getKeys(this.tokenItemTwo);
        var pget = Promise.promisify(this.client.get, {context: this.client});
        return Promise.all([
          this.kansas.tokenModel.get(this.token),
          this.kansas.tokenModel.get(this.tokenItemTwo.token),
          pget(keys.usage),
          pget(keys.usageFuture),
          pget(keysTwo.usage),
          pget(keysTwo.usageFuture),
        ]).then(function(result) {
          expect(result[0].policyName).to.equal('basic', 'token one policyName');
          expect(result[0].period).to.equal('month', 'token one period');
          expect(result[0].limit).to.equal(100, 'token one limit');
          expect(result[1].policyName).to.equal('basic', 'token two policyName');
          expect(result[1].period).to.equal('month', 'token two period');
          expect(result[1].limit).to.equal(100, 'token two limit');
          expect(result[2]).to.equal('100', 'usage one');
          expect(result[3]).to.equal('100', 'usage one future');
          expect(result[4]).to.equal('100', 'usage two');
          expect(result[5]).to.equal('100', 'usage two future');
        });
      }).then(done, done);
  });

  it('should count after change plan', function() {
    var change = {
      ownerId: 'basicPolicy1',
      policyName: 'countPolicy',
    };
    return this.kansas.policy.change(change)
      .bind(this)
      .then(function() {
        return this.kansas.tokenModel.get(this.tokenItemBasic.token);
      })
      .then(function(tokenItem) {
        return this.kansas.count(tokenItem.token);
      });
  });
});
