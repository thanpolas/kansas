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

  it('Will create a new application', function(done) {
    req.post('/application')
      .send({name: 'one-to-go', hostname: 'two.three'})
      .expect('location', /[\d]{6}\-one\-to\-go/)
      .expect(302, done);
  });
});

