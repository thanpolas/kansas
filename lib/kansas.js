/*
 * Kansas
 * Rate limited API to go
 * https://github.com/thanpolas/kansas
 *
 * Copyright (c) 2014 Thanasis Polychronakis
 * Licensed under the MIT license.
 */
var Kansas = require('./main/kansas.main.js');
var Initdb = require('../test/lib/fixtures-api');

/**
 * The main factory.
 *
 * @param {Object=} optOptions Options to configure Kansas.
 * @return {Kansas} A Kansas instance.
 */
var kansas = module.exports = function(optOptions) {
  return new Kansas(optOptions);
};

// export initdb
kansas.Initdb = Initdb;
