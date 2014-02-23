/**
 * @fileOverview Manage Token tests.
 */

var chai = require('chai');
var expect = chai.expect;

var kansasApi = require('../../');

var tester = require('../lib/tester');
var Web = require('../lib/web');

describe.skip('Token Manage ops', function() {
  var req;
  var kansas;
  var appDoc;

  kansas = kansasApi();

  before(tester.webserver(kansas));

  beforeEach(function(done) {
    var web = new Web(tester.expressApp);
    req = web.req;
    done();
  });

  beforeEach(function(done) {
    kansas.appEnt.delete({name: 'one-to-go'})
      .then(done.bind(null, null))
      .catch(done);
  });

  beforeEach(function(done) {
    kansas.appEnt.create({
      name: 'one-to-go',
      hostname: 'two.three',
    }).then(function(doc) {
      appDoc = doc;
    }).then(done, done);
  });

  describe('Create Ops', function () {
    it('Will create a new token', function(done) {
      req.post('/token')
        .send({applicationId: appDoc._id})
        .expect('location', /token\/[\d\w]{32}/)
        .expect(302, done);
    });
    it('Will create a new token and return the JSON object', function(done) {
      req.post('/token')
        .set('Accept', 'application/json')
        .send({applicationId: appDoc._id})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.have.keys([
            'token',
            'createdOn',
            'applicationId',
          ]);
        }).end(done);
    });
  });
  describe('Read Ops', function() {
    var tokenDoc;
    beforeEach(function(done) {
      kansas.tokenEnt.create({
        applicationId: appDoc._id,
      }).then(function(doc) {
        tokenDoc = doc;
      }).then(done, done);
    });

    it('Will read a record', function(done) {
      req.get('/token/' + tokenDoc.token)
        .expect(200)
        .expect(/token\/[\d\w]{32}/, done);
    });
    it('Will read a record using JSON', function(done) {
      req.get('/token/' + tokenDoc.token)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.have.keys([
            'token',
            'createdOn',
            'applicationId',
          ]);
        }).end(done);
    });
  });
  describe('Delete Ops', function() {
    var tokenDoc;
    beforeEach(function(done) {
      kansas.tokenEnt.create({
        applicationId: appDoc._id,
      }).then(function(doc) {
        tokenDoc = doc;
      }).then(done, done);
    });
    it('Will delete a record', function(done) {
      req.del('/token/' + tokenDoc.token)
        .expect(302)
        .expect('location', '/token')
        .end(function(err) {
          if (err) { return done(err); }
          kansas.tokenEnt.readOne({token: tokenDoc.token})
            .then(function(res) {
              expect(res).to.be.null;
            }).then(done, done);
        });
    });
    it('Will delete a record using JSON', function(done) {
      req.del('/token/' + tokenDoc.token)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err) {
          if (err) { return done(err); }
          kansas.tokenEnt.readOne({token: tokenDoc.token})
            .then(function(res) {
              expect(res).to.be.null;
            }).then(done, done);
        });
    });
  });
});
