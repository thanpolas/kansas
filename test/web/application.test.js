/**
 * @fileOverview Application CRUD tests.
 */

var chai = require('chai');
var expect = chai.expect;

var kansasApi = require('../../');

var tester = require('../lib/tester');
var Web = require('../lib/web');

describe('Application CRUD ops', function() {
  var req;
  var expressApp;
  var kansas;

  before(function(done) {
    kansas = kansasApi();
    kansas.connect().then(function() {
      tester.express(6699, function(app) {
        expressApp = app;
        kansas.express(expressApp);
      }).then(done.bind(null, null));
    }).catch(done);
  });

  beforeEach(function(done) {
    var web = new Web(expressApp);
    req = web.req;
    done();
  });

  beforeEach(function(done) {
    kansas.appEnt.delete({name: 'one-to-go'})
      .then(done.bind(null, null))
      .catch(done);
  });

  describe('Create Ops', function () {
    it('Will create a new application', function(done) {
      req.post('/application')
        .send({name: 'one-to-go', hostname: 'two.three'})
        .expect('location', /[\d]{6}\-one\-to\-go/)
        .expect(302, done);
    });
    it('Will create a new application and return the JSON object', function(done) {
      req.post('/application')
        .set('Accept', 'application/json')
        .send({name: 'one-to-go', hostname: 'two.three'})
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.have.keys([
            'name',
            'uniqueUrl',
            'hostname',
            'ownerId',
            'createdOn',
            'tokens',
          ]);
        }).end(done);
    });
  });
  describe('Read Ops', function() {
    var appDoc;
    beforeEach(function(done) {
      kansas.appEnt.create({
        name: 'one-to-go',
        hostname: 'two.three',
      }).then(function(doc) {
        appDoc = doc;
      }).then(done, done);
    });

    it('Will read a record', function(done) {
      req.get('/application/' + appDoc.uniqueUrl)
        .expect(200)
        .expect(/one\-to\-go/, done);
    });
    it('Will read a record using JSON', function(done) {
      req.get('/application/' + appDoc.uniqueUrl)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .expect(function(res) {
          expect(res.body).to.have.keys([
            'name',
            'uniqueUrl',
            'hostname',
            'ownerId',
            'createdOn',
            'tokens',
          ]);
        }).end(done);
    });
  });
  describe('Delete Ops', function() {
    var appDoc;
    beforeEach(function(done) {
      kansas.appEnt.create({
        name: 'one-to-go',
        hostname: 'two.three',
      }).then(function(doc) {
        appDoc = doc;
      }).then(done, done);
    });
    it('Will delete a record', function(done) {
      req.del('/application/' + appDoc.uniqueUrl)
        .expect(302)
        .expect('location', '/application')
        .end(function(err) {
          if (err) { return done(err); }
          kansas.appEnt.readOne({name: 'one-to-go'})
            .then(function(res) {
              expect(res).to.be.null;
            }).then(done, done);
        });
    });
    it('Will delete a record using JSON', function(done) {
      req.del('/application/' + appDoc.uniqueUrl)
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function(err) {
          if (err) { return done(err); }
          kansas.appEnt.readOne({name: 'one-to-go'})
            .then(function(res) {
              expect(res).to.be.null;
            }).then(done, done);
        });
    });
  });
});
