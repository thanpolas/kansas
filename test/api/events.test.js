/**
 * @fileOverview Events emitted by Kansas.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var fixtures = require('../lib/fixtures-api');
var tokenAssert = require('../lib/token-assertions.js');
var policyAssert = require('../lib/policy-assertions.js');

describe('Events', function() {
  this.timeout(4000);
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  it('Emits a token create event', function(done) {
    fix.api.on('create', function(tokenItem) {
      tokenAssert.properties(tokenItem);
      tokenAssert.types(tokenItem);
      tokenAssert.values(tokenItem);
      done();
    });

    fix.api.create({
      ownerId: 'hip',
      policyName: 'free',
    });
  });
  it('Emits a token delete event', function(done) {
    fix.api.on('delete', function(tokenItem) {
      tokenAssert.properties(tokenItem);
      tokenAssert.types(tokenItem);
      tokenAssert.values(tokenItem);
      done();
    });

    fix.api.del(fix.token);
  });

  it('Emits a token consume event', function(done) {
    fix.api.on('consume', function(token, consumed, remaining) {
      expect(token).to.equal(fix.token);
      expect(consumed).to.equal(1);
      expect(remaining).to.equal(9);
      done();
    });

    fix.api.consume(fix.token);
  });

  it('Emits a Policy Change event', function(done) {
    fix.api.on('policyChange', function(change, policy) {
      expect(change).to.be.an('Object');
      expect(policy).to.be.an('Object');
      expect(change.ownerId).to.equal('hip');
      expect(change.policyName).to.equal('free');

      policyAssert.all(policy);
      done();
    });

    fix.api.consume(fix.token);
  });

  it('Emits a Max Tokens event', function(done) {
    fix.api.on('maxTokens', function(opts, maxTokens) {
      expect(opts).to.be.an('Object');
      expect(opts.ownerId).to.equal('hip');
      expect(opts.policyName).to.equal('free');
      expect(maxTokens).to.equal(3);
      done();
    });

    fix.api.create({
      ownerId: 'hip',
      policyName: 'free',
    });
    fix.api.create({
      ownerId: 'hip',
      policyName: 'free',
    });
    fix.api.create({
      ownerId: 'hip',
      policyName: 'free',
    });
  });
});
