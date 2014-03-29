/**
 * @fileOverview Period Bucket calculator, provides helper functions for getting
 *   the proper period names to use as keys (buckets) for redis.
 */
var floordate = require('floordate');

var period = module.exports = {};

/** @enum {string} Supported time units */
period.Period = {
  DAY: 'day',
  MONTH: 'month',
};

/** @type {Array} A helper for validating periods */
period.periods = [
  period.Period.DAY,
  period.Period.MONTH,
];

/**
 * Format a Date instance to per-day precision key property for redis.
 *
 * @param {Date} d instance of Date.
 * @return {string} Properly formated string '2014-02-04'.
 */
period.format = function(d) {
  return d.getFullYear() + '-' +
    period.getMonth(d) + '-' +
    period.getDate(d);
};

/**
 * Returns the period bucket key for current time.
 *
 * @param {kansas.model.period.Period} periodName.
 * @return {string} the period bucket.
 */
period.get = function(periodName) {
  var d = new Date();

  var floored = floordate(d, periodName);
  return period.format(floored);
};

/**
 * Get a future period in time for n units.
 *
 * @param {kansas.model.period.Period} period The period.
 * @return {string} The period bucket.
 */
period.getFuture = function(periodName) {
  var d = new Date();

  var floored = floordate(d, periodName);
  switch(periodName) {
  case period.Period.DAY:
    floored.setDate(floored.getDate() + 1);
    break;
  case period.Period.MONTH:
    floored.setMonth(floored.getMonth() + 1);
    break;
  }

  return period.format(floordate(floored, periodName));
};

/**
 * Get the string numerical representation for month from '01' to '12'.
 *
 * @param {Date} d Instance of date.
 * @return {string} '01' to '12'.
 */
period.getMonth = function(d) {
  var month = d.getMonth() + 1;
  if (month < 10) {
    return '0' + month;
  } else {
    return month + '';
  }
};

/**
 * Get the string numerical representation for date from '01' to '31'.
 *
 * @param {Date} d Instance of date.
 * @return {string} '01' to '31'.
 */
period.getDate = function(d) {
  var day = d.getDate();
  if (day < 10) {
    return '0' + day;
  } else {
    return day + '';
  }
};
