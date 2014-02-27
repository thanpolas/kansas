/**
 * @fileOverview API Surface tests
 */
var chai = require('chai');
var expect = chai.expect;

var kansas = require('../..');

describe('Policy tests', function () {
  var api;
  beforeEach(function(done) {
    api = kansas();
    api.connect().then(done, done);
  });
  it('should create a policy', function() {
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
