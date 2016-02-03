/*
 * @fileOverview Main testing helper lib.
 */
var kansas = require('../..');

var tester = module.exports = {};

tester.kansas = kansas;

tester.dbinited = false;

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

/**
 * Provide some fixtures in the store:
 * - A Policy "free", maxTokens: 3, limit: 10, period: month
 * - A Policy "basic", maxTokens: 10, limit: 100, period: month
 * - A Token of policy "free"
 * - A second Token of policy "free"
 *
 */
tester.initdb = function() {
  beforeEach(function() {
    var initdb = new kansas.Initdb();
    console.log('initdb...');
    return initdb.start()
      .bind(this)
      .then(function(fixtureInstance) {

        this.client = fixtureInstance.client;
        this.policyItem = fixtureInstance.policyItem;
        this.policyItemBasic = fixtureInstance.policyItemBasic;
        this.policyCount = fixtureInstance.policyCount;
        this.kansas = fixtureInstance.kansas;
        this.token = fixtureInstance.token;
        this.tokenItem = fixtureInstance.tokenItem;
        this.tokenItemTwo = fixtureInstance.tokenItemTwo;
        this.tokenItemCount = fixtureInstance.tokenItemCount;
      });
  });
};
