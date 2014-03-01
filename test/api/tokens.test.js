/**
 * @fileOverview API tokens tests
 */
var chai = require('chai');
var expect = chai.expect;
var Promise = require('bluebird');

var kansas = require('../..');
var Redis = require('../../lib/main/redis.main');
var period = require('../../lib/models/period-bucket.model');
var kansasError = require('../../lib/util/error');
var tokenAssert = require('../lib/token-assertions');

describe('Tokens tests', function () {
  this.timeout(4000);
  var client;
  var policyItem;
  var api;

  beforeEach(function(done) {
    api = kansas({
      prefix: 'test',
      logging: false,
    });
    api.connect().then(done, done);
  });

  beforeEach(function(done) {
    if (client) { return done(); }
    var redis = new Redis();
    redis.connect().then(function(cl) {
      client = cl;
      done();
    }).catch(done);
  });
  beforeEach(function(done) {
    api.db.nuke('Yes purge all records irreversably', 'test')
      .then(done, done);
  });
  beforeEach(function() {
    policyItem = api.policy.create({
      name: 'free',
      maxTokens: 3,
      limit: 10,
      period: 'month',
    });
  });

  describe('SET', function() {
    it('returned properties', function(done) {
      api.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(tokenAssert.properties)
        .then(done, done);
    });
    it('returned types', function(done) {
      api.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(tokenAssert.types)
        .then(done, done);
    });
    it('returned values', function(done) {
      api.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(tokenAssert.values)
        .then(done, done);
    });
    it('Check index and bucket keys created', function(done) {
      api.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(function(item) {

        var periodBucket = period.get('month');
        var periodBucketFuture = period.getFuture('month');
        var indexKey = 'test:kansas:index:token:' + item.ownerId;
        var keys = [
          'test:kansas:token:' + item.token,
          'test:kansas:usage:' + periodBucket + ':' + item.token,
          'test:kansas:usage:' + periodBucketFuture + ':' + item.token,
          indexKey,
        ];
        return api.tokenModel.existsAll(keys).then(function(result) {
          expect(!!result[0], 'token').to.be.true;
          expect(!!result[1], 'usage').to.be.true;
          expect(!!result[2], 'index').to.be.true;
          return new Promise(function(resolve, reject) {
            client.sismember(indexKey, item.token, function(err, res) {
              if (err) { return reject(); }
              expect(!!res, 'index.token').to.be.true;
              resolve();
            });
          });
        });
      }).then(done, done);
    });
  });

  describe('Delete', function() {
    var tokenItem;

    beforeEach(function(done) {
      api.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(function(item) {
        tokenItem = item;
      }).then(done, done);
    });

    it('removes all keys, token, usage, index', function(done) {
      api.del(tokenItem.token).then(function() {
        var periodBucket = period.get('month');
        var indexKey = 'test:kansas:index:token:' + tokenItem.ownerId;
        var keys = [
          'test:kansas:token:' + tokenItem.token,
          'test:kansas:usage:' + periodBucket + ':' + tokenItem.token,
          indexKey,
        ];
        return api.tokenModel.existsAll(keys).then(function(result) {
          expect(!!result[0], 'token').to.be.false;
          expect(!!result[1], 'usage').to.be.false;
          expect(!!result[2], 'index').to.be.false;
          return new Promise(function(resolve, reject) {
            client.sismember(indexKey, tokenItem.token, function(err, res) {
              if (err) { return reject(); }
              expect(!!res, 'index.token').to.be.false;
              resolve();
            });
          });
        });
      }).then(done, done);
    });
  });

  describe('MaxTokens Policy', function() {
    it('will trigger MaxTokens error when reaching token limit', function(done) {
      Promise.all([
        api.set({policyName: policyItem.name, ownerId: 'hip'}),
        api.set({policyName: policyItem.name, ownerId: 'hip'}),
        api.set({policyName: policyItem.name, ownerId: 'hip'}),
      ]).then(function() {
        api.set({policyName: policyItem.name, ownerId: 'hip'})
          .then(function() {
            throw new Error('token.set() Should not resolve');
          }, function(err) {
            expect(err).to.be.instanceOf(kansasError.Policy);
            expect(err.type).to.equal(kansasError.Policy.Type.MAX_TOKENS_PER_USER);
          });
      }).then(done, done);
    });
  });


  describe('Get', function() {
    var tokenItemOne;
    var tokenItemTwo;

    beforeEach(function(done) {
      api.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(function(item) {
        tokenItemOne = item;
      }).then(done, done);
    });
    beforeEach(function(done) {
      api.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(function(item) {
        tokenItemTwo = item;
      }).then(done, done);
    });

    it('Will get a token item and have correct properties', function(done) {
      api.get(tokenItemOne.token).then(tokenAssert.properties)
        .then(done, done);
    });
    it('Will get a token item and have correct types', function(done) {
      api.get(tokenItemOne.token).then(tokenAssert.types)
        .then(done, done);
    });
    it('Will get a token item and have correct values', function(done) {
      api.get(tokenItemOne.token).then(tokenAssert.values)
        .then(done, done);
    });

    it('Will get all by owner id', function(done) {
      api.getByOwnerId('hip').then(function(items) {
        expect(items).to.be.an('array');
        expect(items).to.have.length(2);
      }).then(done, done);
    });
  });
});
