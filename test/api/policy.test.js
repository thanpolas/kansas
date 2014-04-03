/**
 * @fileOverview API Policy tests
 */
var chai = require('chai');
var expect = chai.expect;

var kansas = require('../..');

describe.skip('Policy tests', function () {
  var api;
  beforeEach(function(done) {
    api = kansas({logging: true});
    api.connect().then(done, done);
  });

  describe('Create Limit policies', function() {
    it('should create a limit policy', function() {
      var policy = api.policy.create({
        name: 'free',
        maxTokens: 3,
        limit: 10,
        period: 'month',
      });
      expect(policy.name).to.equal('free');
      expect(policy.maxTokens).to.equal(3);
      expect(policy.limit).to.equal(10);
      expect(policy.period).to.equal('month');
      expect(policy.count).to.be.false;
    });
    it('should get a policy', function() {
      api.policy.create({
        name: 'free',
        maxTokens: 3,
        limit: 10,
        period: 'month',
      });
      var policy = api.policy.get('free');
      expect(policy.name).to.equal('free');
      expect(policy.maxTokens).to.equal(3);
      expect(policy.limit).to.equal(10);
      expect(policy.period).to.equal('month');
      expect(policy.count).to.be.false;
    });
    it('should check a policy exists', function() {
      api.policy.create({
        name: 'free',
        maxTokens: 3,
        limit: 10,
        period: 'month',
      });
      expect(api.policy.has('free')).to.be.true;
    });
  });
  describe('Create Count Policies', function () {
    it('should create a count policy', function () {
      var policy = api.policy.create({
        name: 'aha',
        maxTokens: 5,
        count: true,
      });

      expect(policy.name).to.equal('aha');
      expect(policy.maxTokens).to.equal(5);
      expect(policy.limit).to.equal(NaN);
      expect(policy.period).to.equal('month');
      expect(policy.count).to.be.true;
    });
  });
});
