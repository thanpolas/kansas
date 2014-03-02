/**
 * @fileoverview Helpers.
 */
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


