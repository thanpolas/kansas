/**
 * @fileoverview Helpers.
 */
var slug = require('slug');

var helpers = module.exports = {};

/**
 * Generate a random string.
 *
 * @param  {number=} optLength How long the string should be, default 32.
 * @return {string} a random string.
 */
helpers.generateRandomString = function(optLength) {
  var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';

  var length = optLength || 32;
  var string = '';
  var randomNumber = 0;
  for (var i = 0; i < length; i++) {
    randomNumber = Math.floor(Math.random() * chars.length);
    string += chars.substring(randomNumber, randomNumber + 1);
  }

  return string;
};

/**
 * Generate a random number, returns type string!.
 *
 * @param  {number=} optLength How long, default 20.
 * @return {string} A random number cast to string.
 */
helpers.generateRandomNumber = function(optLength) {
  var nums = '0123456789';
  var numLen = nums.length;
  var length = optLength || 20;

  var string = '';
  var randomNumber = 0;
  for (var i = 0; i < length; i++) {
    randomNumber = Math.floor(Math.random() * numLen);
    string += nums.substring(randomNumber, randomNumber + 1);
  }

  return string;
};


/**
 * Returns a unique-ish url-friendly string,
 * uses a 6 random number to raise entropy.
 *
 * @param  {string} token The token you need to be urlified.
 * @param {number=} optRandLen Define how many random numbers, default 6,
 *  disable 0.
 * @return {string} urlefied string.
 */
helpers.urlify = function(token, optRandLen) {
  var randLen = 6;
  if (typeof optRandLen === 'number') {
    randLen = optRandLen;
  }
  var out = '';
  if (randLen) {
    out += helpers.generateRandomNumber(randLen);
    out += '-';
  }
  out += slug(token).toLowerCase();
  return out;
};

helpers.getTimeBucket = function() {

};
