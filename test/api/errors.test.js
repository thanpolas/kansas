/**
 * @fileOverview Errors generated by Kansas.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var fixtures = require('../lib/fixtures-api');
var kansas = require('../..');

describe('Errors', function() {
  this.timeout(4000);
  var fix;
  var error;

  fixtures.setupCase(function(res) {
    fix = res;
    error = fix.api.error;
  });

  it('Will produce a database error if redis credentials are wrong', function(done) {
    var api = kansas({
      redis: {
        host: 'troll',
        port: 0,
      }
    });

    api.connect().catch(function(err) {
      expect(err).to.be.instanceOf(error.Database);
      expect(err.type).to.equal(error.Database.Type.REDIS_CONNECTION);
    }).then(done, done);

  });

  describe('Token Create Errors', function () {
    it('will produce a Validation error if ownerId is not provided', function (done) {
      fix.api.create({
        policyName: 'free',
      }).catch(function(err) {
        expect(err).to.be.instanceOf(error.Validation);
      }).then(done, done);
    });
    it('will produce a Validation error if ownerId is empty string', function (done) {
      fix.api.create({
        ownerId: '',
        policyName: 'free',
      }).catch(function(err) {
        expect(err).to.be.instanceOf(error.Validation);
      }).then(done, done);
    });
    it('will produce a Policy error if policyName is not provided', function (done) {
      fix.api.create({
        ownerId: 'hip',
      }).catch(function(err) {
        expect(err).to.be.instanceOf(error.Policy);
      }).then(done, done);
    });
    it('will produce a Policy error if policyName does not exist', function (done) {
      fix.api.create({
        ownerId: 'hip',
        policyName: 'troll',
      }).catch(function(err) {
        expect(err).to.be.instanceOf(error.Policy);
      }).then(done, done);
    });
  });

  describe('Consume Errors', function () {
    it('will produce a TokenNotExists error when token does not exist', function (done) {
      fix.api.consume('troll')
        .catch(function(err) {
          expect(err).to.be.instanceOf(error.TokenNotExists);
        })
        .then(done, done);
    });
    it('will produce a UsageLimit error when limit is exceeded', function (done) {
      fix.api.consume(fix.token, 10)
        .then(function() {
          fix.api.consume(fix.token)
          .catch(function(err) {
            expect(err).to.be.instanceOf(error.UsageLimit);
          })
          .then(done, done);
        });
    });
  });
});
