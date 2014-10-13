/**
 * @fileOverview Accounting model unit tests.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var fixtures = require('../lib/fixtures-api');

describe('Accounting', function() {
  this.timeout(4000);
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  it('changePolicy() will alter the records', function(done) {
    var change = {
      ownerId: fix.tokenItem.ownerId,
      policyName: 'basic',
    };
    fix.kansas.policy.change(change)
      .then(function() {
        var keys = fix.kansas.tokenModel.getKeys(fix.tokenItem);
        var keysTwo = fix.kansas.tokenModel.getKeys(fix.tokenItemTwo);
        var pget = Promise.promisify(fix.client.get, fix.client);
        return Promise.all([
          fix.kansas.tokenModel.get(fix.token),
          fix.kansas.tokenModel.get(fix.tokenItemTwo.token),
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
});
