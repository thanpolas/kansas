/*
 * @fileOverview Main testing helper lib.
 */
var http = require('http');

var Promise = require('bluebird');
var connect = require('connect');
var express = require('express');
var RedisStore = require('connect-redis')(express);
var flash = require('connect-flash');

var kansas = require('../..');

var tester = module.exports = {};

var WEBSERVER_PORT = '6699';

tester.kansas = kansas;

tester.setup = null;
tester.teardown = null;

if (global.setup) {
  tester.setup = setup;
  tester.teardown = teardown;
} else {
  tester.setup = beforeEach;
  tester.teardown = afterEach;
}

/**
 * Have a Cooldown period between tests.
 *
 * @param {number} seconds cooldown in seconds.
 * @return {Function} use is beforeEach().
 */
tester.cooldown = function(seconds) {
  return function(done) {
    setTimeout(done, seconds);
  };
};

tester.expressApp = null;

/**
 * Webserver setup helper for tests.
 *
 * @param {kansas} kansas A Kansas instance.
 * @return {Function} The setup.
 */
tester.webserver = function(kansas) {
  return function(done) {
    kansas.connect().then(function() {
      if (tester.expressApp) {
        kansas.express(tester.expressApp);
        done();
      } else {
        tester.express(WEBSERVER_PORT, function(app) {
          tester.expressApp = app;
          kansas.express(tester.expressApp);
        }).then(done.bind(null, null));
      }
    }).catch(done);
  };
};

/**
 * Kick off a webserver...
 *
 * @param {string=} port Port number.
 * @param {Function(Express)=} optPayload Will be invoked after express is setup and
 *   before the error handler middleware.
 * @return {Promise(Object)} a promise provides an object with these props:
 *   @param {Express} app The express instance.
 *   @param {http} webserver The http instance.
 */
tester.express = function(port, optPayload) {
  var payload = optPayload || function() {};
  return new Promise(function(resolve, reject) {
    var app = express();

    // Setup express
    app.set('port', port);
    app.set('view engine', 'jade');
    app.use(express.cookieParser());

    var sessionStore;

    // Sessions stored in redis
    sessionStore = new RedisStore({
      // https://github.com/visionmedia/connect-redis#options
      host: 'localhost',
      port: '6379',
      prefix: 'ccSession:',
    });
    var storeDeferred = new Promise.defer();
    sessionStore.on('disconnect', function(err) {
      console.warn('tester.init() :: Session Redis store disconnected. Error:', err);
      storeDeferred.reject(err);
    });
    sessionStore.on('connect', function() {
      console.log('tester.init() :: Session Redis store connected.');
      storeDeferred.resolve();
    });

    app.use(express.session({
      secret: 'not secret',
      store: sessionStore,
      cookie: {
        path: '/',
        httpOnly: false,
        maxAge: null,
      }
    }));

    // Middleware
    app.use(connect.urlencoded());
    app.use(connect.json());

    app.use(express.methodOverride());

    // use flashing for passing messages to next page view
    app.use(flash());

    app.use(app.router);

    payload(app);

    app.use(express.errorHandler());

    var webserverPromise = tester.startWebserver(app);

    Promise.all([
      webserverPromise,
      storeDeferred.promise,
    ]).then(function(result) {
      console.log('tester.express() :: All done.');
      resolve({
        app: app,
        webserver: result[0],
      });
    })
      .catch(reject);
  });
};



/**
 * Start the webserver.
 *
 * @param {Express} app an express instance.
 * @return {Promise(http)} A Promise returning the http instance.
 */
tester.startWebserver = function(app) {
  return new Promise(function(resolve, reject) {
    var webserver = http.createServer(app);
    var port = app.get('port');

    webserver.on('clientError', function(err) {
      console.warn('tester.startWebserver() :: Client Error on port:', port, ':: Exception:', err);
      console.warn('tester.startWebserver() :: Client STACK:', err, err.stack);
    });
    webserver.on('error', function(err) {
      console.error('tester.startWebserver() :: Failed to start web server on port:', port,
        ':: Exception:', err);
      reject(err);
    });

    webserver.listen(app.get('port'), function(){
      console.log('tester.startWebserver() :: Webserver launched. Listening on port: ' + port);
      resolve(webserver);
    });
  });
};

