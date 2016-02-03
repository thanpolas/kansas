/**
 * @fileOverview Token model unit tests.
 */

var Promise = require('bluebird');
var assert = require('chai').assert;


var period = require('../../lib/models/period-bucket.model');
var kansasError = require('../../lib/util/error');
var Redis = require('../../lib/main/redis.main');
var Clean = require('../../lib/db/clean.db');
var TokenModel = require('../../lib/models/token.model');
var PolicyModel = require('../../lib/models/policy.model');
var tokenAssert = require('../lib/token-assertions');

// var tester = require('../lib/tester');

describe('Token Model', function() {
  var client;
  var tokenModel;
  var policyModel;
  var policyItem;

  beforeEach(function(done) {
    if (client) { return done(); }
    var redis = new Redis();
    redis.connect().then(function(cl) {
      client = cl;
      done();
    }).catch(done);
  });
  beforeEach(function(done) {
    var clean = new Clean(client, {prefix: 'test'});
    clean.nuke('Yes purge all records irreversibly', 'test')
      .then(done, done);
  });
  beforeEach(function() {
    if (policyModel) { return; }
    policyModel = new PolicyModel();
    tokenModel = new TokenModel(client, {prefix: 'test'});
    tokenModel.setPolicy(policyModel);
  });

  beforeEach(function() {
    if (policyItem) { return; }
    policyItem = policyModel.create({
      name: 'free',
      maxTokens: 3,
      limit: 10,
      period: 'month',
    });
  });

  describe('SET', function() {
    it('returned properties', function(done) {
      tokenModel.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(tokenAssert.properties)
        .then(done, done);
    });
    it('returned types', function(done) {
      tokenModel.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(tokenAssert.types)
        .then(done, done);
    });
    it('returned values', function(done) {
      tokenModel.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(tokenAssert.values)
        .then(done, done);
    });
    it('use custom token', function(done) {
      tokenModel.set({
        policyName: policyItem.name,
        ownerId: 'hip',
        token: 'custom',
      }).then(function(tokenItem) {
        assert.equal(tokenItem.token, 'custom');
      }).then(done, done);
    });
    it('Check index and bucket keys created', function(done) {
      tokenModel.set({
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
        return tokenModel.existsAll(keys).then(function(result) {
          assert.ok(!!result[0], 'token');
          assert.ok(!!result[1], 'usage');
          assert.ok(!!result[2], 'index');
          return new Promise(function(resolve, reject) {
            client.sismember(indexKey, item.token, function(err, res) {
              if (err) { return reject(); }
              assert.ok(!!res, 'index.token');
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
      tokenModel.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(function(item) {
        tokenItem = item;
      }).then(done, done);
    });

    it('removes all keys, token, usage, index', function(done) {
      tokenModel.del(tokenItem.token).then(function() {
        var periodBucket = period.get('month');
        var indexKey = 'test:kansas:index:token:' + tokenItem.ownerId;
        var keys = [
          'test:kansas:token:' + tokenItem.token,
          'test:kansas:usage:' + periodBucket + ':' + tokenItem.token,
          indexKey,
        ];
        return tokenModel.existsAll(keys).then(function(result) {
          assert.notOk(!!result[0], 'token');
          assert.notOk(!!result[1], 'usage');
          assert.notOk(!!result[2], 'index');
          return new Promise(function(resolve, reject) {
            client.sismember(indexKey, tokenItem.token, function(err, res) {
              if (err) { return reject(); }
              assert.notOk(!!res, 'index.token');
              resolve();
            });
          });
        });
      }).then(done, done);
    });

    it('remove a non existing key', function(done) {
      tokenModel.del('zit').then(done, done);
    });
  });

  describe('MaxTokens Policy', function() {
    it('will trigger MaxTokens error when reaching token limit', function(done) {
      Promise.all([
        tokenModel.set({policyName: policyItem.name, ownerId: 'hip'}),
        tokenModel.set({policyName: policyItem.name, ownerId: 'hip'}),
        tokenModel.set({policyName: policyItem.name, ownerId: 'hip'}),
      ]).then(function() {
        tokenModel.set({policyName: policyItem.name, ownerId: 'hip'})
          .then(function() {
            throw new Error('token.set() Should not resolve');
          }, function(err) {
            assert.instanceOf(err, kansasError.Policy);
            assert.equal(err.type, kansasError.Policy.Type.MAX_TOKENS_PER_USER);
          });
      }).then(done, done);
    });
  });


  describe('Get', function() {
    var tokenItemOne;
    var tokenItemTwo;

    beforeEach(function(done) {
      tokenModel.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(function(item) {
        tokenItemOne = item;
      }).then(done, done);
    });
    beforeEach(function(done) {
      tokenModel.set({
        policyName: policyItem.name,
        ownerId: 'hip',
      }).then(function(item) {
        tokenItemTwo = item;
      }).then(done, done);
    });

    it('Will get a token item and have correct properties', function(done) {
      tokenModel.get(tokenItemOne.token).then(tokenAssert.properties)
        .then(done, done);
    });
    it('Will get a token item and have correct types', function(done) {
      tokenModel.get(tokenItemOne.token).then(tokenAssert.types)
        .then(done, done);
    });
    it('Will get a token item and have correct values', function(done) {
      tokenModel.get(tokenItemOne.token).then(tokenAssert.values)
        .then(done, done);
    });

    it('Will get all by owner id', function(done) {
      tokenModel.getByOwnerIdActual('hip').then(function(items) {
        assert.isArray(items);
        assert.lengthOf(items, 2);
      }).then(done, done);
    });
  });
});
