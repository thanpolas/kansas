/**
 * @fileOverview The talksession routes.
 */
var crude = require('crude');
var log = require('logg').getLogger('kansas.webRouter');

var router = module.exports = {};

/**
 * A static function to apply routes
 * @param {kansas.Main} kansas An instance of main.
 */
router.init = function(kansas) {
  log.fine('init() :: initializing routes...');
  crude.route.addRaw(kansas.app, kansas.options.routePrefix + '/application',
    kansas.applicationCtrl);
  crude.route.addRaw(kansas.app, kansas.options.routePrefix + '/token',
    kansas.tokenCtrl);
};
