/**
 * @fileOverview Kansas logger facilities.
 */
var Promise = require('bluebird');
var chai = require('chai');
var expect = chai.expect;

var fixtures = require('../lib/fixtures-api');

describe('Logger', function() {
  this.timeout(4000);
  var fix;

  fixtures.setupCase(function(res) {
    fix = res;
  });

  it('FIXME', function(done) {
    done()
  });
});
