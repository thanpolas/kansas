/**
 * @fileOverview API Surface tests
 */
var chai = require('chai');
var expect = chai.expect;

var kansas = require('../..');

describe('Surface tests', function () {
  it('should be a function', function () {
    expect(kansas).to.be.a('function');
  });
  it('should have the expected methods when instantiated', function() {
    var api = kansas();
    expect(api.connect).to.be.a('function', 'connect()');
    expect(api.setup).to.be.a('function', 'setup()');
    expect(api.conn).to.be.a('null', 'conn');

    // token methods
    expect(api.create).to.be.a('null', 'create');
    expect(api.set).to.be.a('null', 'set');
    expect(api.get).to.be.a('null', 'get');
    expect(api.getByOwnerId).to.be.a('null', 'getByOwnerId');
    expect(api.del).to.be.a('null', 'del');
    expect(api.changePolicy).to.be.a('null', 'changePolicy');
    expect(api.consume).to.be.a('null', 'consume');

    // policy methods
    expect(api.policy.create).to.be.a('null', 'policy.create');
    expect(api.policy.get).to.be.a('null', 'policy.get');
    expect(api.policy.has).to.be.a('null', 'policy.del');
    expect(api.policy.model).to.be.a('null', 'policy.model');

    // DB Maintenance
    expect(api.db.prepopulate).to.be.a('null', 'db.prepopulate');
    expect(api.db.nuke).to.be.a('null', 'db.nuke');
    expect(api.tokenModel).to.be.a('null', 'tokenModel');

    // error objects
    expect(api.error.BaseError).to.be.a('function', 'error.BaseError()');
    expect(api.error.Database).to.be.a('function', 'error.Database()');
    expect(api.error.Validation).to.be.a('function', 'error.Validation()');
    expect(api.error.Policy).to.be.a('function', 'error.Policy()');
    expect(api.error.TokenNotExists).to.be.a('function', 'error.TokenNotExists()');
    expect(api.error.UsageLimit).to.be.a('function', 'error.UsageLimit()');
  });

  it('should have the expected methods after connection', function(done) {
    var api = kansas();
    api.connect().then(function() {
      expect(api.conn).to.be.an('Object', 'conn');

      // token methods
      expect(api.create).to.be.a('function', 'create');
      expect(api.set).to.be.a('function', 'set');
      expect(api.get).to.be.a('function', 'get');
      expect(api.getByOwnerId).to.be.a('function', 'getByOwnerId');
      expect(api.del).to.be.a('function', 'del');
      expect(api.changePolicy).to.be.a('function', 'changePolicy');
      expect(api.consume).to.be.a('function', 'consume');

      // policy methods
      expect(api.policy.create).to.be.a('function', 'policy.create');
      expect(api.policy.get).to.be.a('function', 'policy.get');
      expect(api.policy.has).to.be.a('function', 'policy.del');
      expect(api.policy.model).to.be.an('object', 'policy.model');

      // DB Maintenance
      expect(api.db.prepopulate).to.be.a('function', 'db.prepopulate');
      expect(api.db.nuke).to.be.a('function', 'db.nuke');
      expect(api.tokenModel).to.be.a('object', 'tokenModel');
    }).then(done, done);
  });

});
