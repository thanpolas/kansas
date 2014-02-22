/**
 * @fileOverview The base Controller Class all controllers extend from.
 */
var log = require('../util/logger').getLogger('kansas.Controller');
var cip = require('cip');

/**
 * The base Controller Class all controllers extend from.
 *
 * @constructor
 */
var Controller = module.exports = cip.extend(function() {
  /**
   * An array of controlling funcs that will handle requests.
   *
   * If more than two are pushed, all except the last one must use
   * the next() call.
   *
   * @type {Array.<Function(Object, Object, Function(Error=)=)}
   */
  this.use = [];

});

/**
 * Check if an error was passed through session flash.
 *
 * @param {Object} req The request Object.
 * @param {express.Result} res Express response object.
 */
Controller.prototype.checkFlashError = function(req, res) {
  res.locals.error =  !!req.flash('error').shift();
  if (res.locals.error) {
    var errObj = req.flash('errorObj').shift();
    if (!(errObj instanceof Object)) {
      errObj = {};
    }
    res.locals.errorMsg = req.flash('errorMsg').shift();
    res.locals.errorObj = errObj;

    log.finer('checkFlashError() :: session-flash error. path:', req.url,
      'Message:', errObj.message);
  }
};

/**
 * Check if an success message was passed through session flash.
 *
 * @param {Object} req The request Object.
 * @param {express.Result} res Express response object.
 */
Controller.prototype.checkFlashSuccess = function(req, res) {
  res.locals.success =  !!req.flash('success').shift();
  if (res.locals.success) {
    var successObj = req.flash('successObj').shift();
    if (!(successObj instanceof Object)) {
      successObj = {};
    }
    res.locals.successObj = successObj;

    log.finer('checkFlashSuccess() :: session-flash success. path:', req.url);
  }
};


/**
 * Add the error to the session flash.
 *
 * @param {Object} req The request Object.
 * @param {Error} err an instance or child of Error.
 */
Controller.prototype.addFlashError = function(req, err) {
  req.flash('error', true);
  req.flash('errorMsg', err.message);
  req.flash('errorObj', err);
};



/**
 * Add the success message / object to the session flash.
 *
 * @param {Object} req The request Object.
 * @param {Object=} obj Any Object.
 */
Controller.prototype.addFlashSuccess = function(req, obj) {
  req.flash('success', true);
  req.flash('successObj', obj);
};
