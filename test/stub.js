/**
 * @fileOverview Stub express server for testing.
 */

var kansasApi = require('../');
var tester = require('./lib/tester');

var expressApp;
var kansas;
tester.express(6699, function(app) {
  expressApp = app;
  kansas = kansasApi();
  kansas.connect()
    .then(kansas.express.bind(kansas, expressApp));
}).catch(function(err) {
  console.log('Error:', err);
});
