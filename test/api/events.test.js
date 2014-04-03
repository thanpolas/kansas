/**
 * @fileOverview Events emitted by Kansas.
 */
var chai = require('chai');
var expect = chai.expect;

var fixtures = require('../lib/fixtures-api');
var tokenAssert = require('../lib/token-assertions.js');
var policyAssert = require('../lib/policy-assertions.js');

function noop() {}

describe('Events', function() {
  this.timeout(4000);

  fixtures.setupCase();

  it('Emits a token create event', function(done) {
    this.kansas.on('create', function(tokenItem) {
      tokenAssert.properties(tokenItem);
      tokenAssert.types(tokenItem);
      tokenAssert.values(tokenItem);
      done();
    });

    this.kansas.create({
      ownerId: 'hip',
      policyName: 'free',
    });
  });
  it('Emits a token delete event', function(done) {
    this.kansas.on('delete', function(tokenItem) {
      tokenAssert.properties(tokenItem);
      tokenAssert.types(tokenItem);
      tokenAssert.values(tokenItem);
      done();
    });

    this.kansas.del(this.token);
  });

  it('Emits a token consume event', function(done) {
    var self = this;
    this.kansas.on('consume', function(token, consumed, remaining) {
      expect(token).to.equal(self.token);
      expect(consumed).to.equal(1);
      expect(remaining).to.equal(9);
      done();
    });

    this.kansas.consume(this.token);
  });

  it('Emits a Policy Change event', function(done) {
    var self = this;
    this.kansas.on('policyChange', function(change, policy) {
      expect(change).to.be.an('Object');
      expect(policy).to.be.an('Object');
      expect(change.ownerId).to.equal('hip');
      expect(change.policyName).to.equal('basic');

      policyAssert.all(policy, self.policyItemBasic);
      done();
    });

    var change = {
      ownerId: this.tokenItem.ownerId,
      policyName: 'basic',
    };
    this.kansas.policy.change(change);
  });

  it('Emits a Max Tokens event', function(done) {
    this.kansas.on('maxTokens', function(opts, maxTokens) {
      expect(opts).to.be.an('Object');
      expect(opts.ownerId).to.equal('hip');
      expect(opts.policyName).to.equal('free');
      expect(maxTokens).to.equal(3);
      done();
    });

    this.kansas.create({
      ownerId: 'hip',
      policyName: 'free',
    });

    var self = this;
    this.kansas.create({
      ownerId: 'hip',
      policyName: 'free',
    }).then(function() {
      self.kansas.create({
        ownerId: 'hip',
        policyName: 'free',
      }).catch(noop);
    });
  });
});
