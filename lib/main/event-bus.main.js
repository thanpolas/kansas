/**
 * @fileOverview Kansas main event bus.
 */
var EventEmitter = require('events').EventEmitter;

var cip = require('cip');

var CeventEmitter = cip.cast(EventEmitter);

var EventBus = module.exports = CeventEmitter.extend();

/** @enum {string} Events emitted. */
EventBus.Event = {
  CREATE: 'create',
  DELETE: 'delete',
  CONSUME: 'consume',
  POLICY_CHANGE: 'policyChange',
  MAX_TOKENS: 'maxTokens',
};
