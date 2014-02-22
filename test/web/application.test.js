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
    tester.express(6699, function(app) {
      expressApp = app;
      kansas = kansasApi();
      kansas.connect()
        .then(kansas.express.bind(kansas, expressApp))
        .then(done.bind(null, null));
    }).catch(done);
  });

  beforeEach(function(done) {
    var web = new Web(expressApp);
    req = web.req;
    done();
  });

  it('Will create a new application', function(done) {
    req.post('/application')
      .expect(200, done);
  });
});

