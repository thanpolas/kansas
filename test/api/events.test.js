/**
 * @fileOverview Events emitted by Kansas.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var fixtures = require('../lib/fixtures-api');
var tokenAssert = require('../lib/token-assertions.js');

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

    fix.api.del(fix.token);
  });

});
