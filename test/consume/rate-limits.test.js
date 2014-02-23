/**
 * @fileOverview Rate limits.
 */

var chai = require('chai');
var expect = chai.expect;

var kansasApi = require('../../');

var tester = require('../lib/tester');
var Web = require('../lib/web');

describe.skip('Rate limiting', function() {
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
  });
});

