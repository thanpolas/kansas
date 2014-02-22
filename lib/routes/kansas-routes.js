/**
 * @fileOverview The talksession routes.
 */
var crude = require('crude');
var log = require('logg').getLogger('kansas.webRouter');

var ApplicationCtrl = require('../controllers/manage/application.ctrl');

var router = module.exports = {};

router.init = function(app) {
  log.fine('init() :: initializing routes...');
  var applicationCtrl = ApplicationCtrl.getInstance();

  crude.route.addRaw(app, '/application', applicationCtrl);
};
