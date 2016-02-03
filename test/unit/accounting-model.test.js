/**
 * @fileOverview Accounting model unit tests.
 */
var Promise = require('bluebird');
var assert = require('chai').assert;
var fixtures = require('../lib/fixtures');

describe('Accounting Model', function() {
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  it('changePolicy() will alter the records', function(done) {
    var change = {
      ownerId: fix.tokenItem.ownerId,
      policyName: 'basic',
    };
    fix.accountingModel.changePolicy(change)
      .then(function() {
        var keys = fix.tokenModel.getKeys(fix.tokenItem);
        var keysTwo = fix.tokenModel.getKeys(fix.tokenItemTwo);
        var pget = Promise.promisify(fix.client.get, {context: fix.client});
        return Promise.all([
          fix.tokenModel.get(fix.token),
          fix.tokenModel.get(fix.tokenItemTwo.token),
          pget(keys.usage),
          pget(keys.usageFuture),
          pget(keysTwo.usage),
          pget(keysTwo.usageFuture),
        ]).then(function(result) {
          assert.equal(result[0].policyName, 'basic', 'token one policyName');
          assert.equal(result[0].period, 'month', 'token one period');
          assert.equal(result[0].limit, '100', 'token one limit');
          assert.equal(result[1].policyName, 'basic', 'token two policyName');
          assert.equal(result[1].period, 'month', 'token two period');
          assert.equal(result[1].limit, '100', 'token two limit');
          assert.equal(result[2], 100, 'usage one');
          assert.equal(result[3], 100, 'usage one future');
          assert.equal(result[4], 100, 'usage two');
          assert.equal(result[5], 100, 'usage two future');
        });
      }).then(done, done);
  });
});
